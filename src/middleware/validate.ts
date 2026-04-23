import { createRequire } from "node:module";
import type { ValidateFunction } from "ajv";
import type { RequestHandler } from "express";
import type { JSONSchema } from "json-schema-to-ts";
import { ApiError, ErrorCodes } from "../utils/errors.js";

// Ajv & ajv-formats ship as CJS and don't interop cleanly with NodeNext ESM
// imports. Use `createRequire` for a clean construction path.
const require = createRequire(import.meta.url);
const Ajv: typeof import("ajv").default = require("ajv").default ?? require("ajv");
const addFormats: typeof import("ajv-formats").default = require("ajv-formats").default ?? require("ajv-formats");

const ajv = new Ajv({ allErrors: true, removeAdditional: false, useDefaults: true });
addFormats(ajv);

const compiledCache = new WeakMap<object, ValidateFunction>();

function compile<S extends JSONSchema>(schema: S): ValidateFunction {
  const key = schema as unknown as object;
  const cached = compiledCache.get(key);
  if (cached) return cached;
  const validator = ajv.compile(schema as object);
  compiledCache.set(key, validator);
  return validator;
}

/**
 * Validates req.body against a JSON schema. On success assigns req.dtoIn.
 * On failure emits ApiError with "unsupportedKeys" or "invalidInput".
 */
export function validateBody<S extends JSONSchema>(schema: S): RequestHandler {
  const validator = compile(schema);
  return (req, _res, next) => {
    const dtoIn = (req.body ?? {}) as Record<string, unknown>;
    req.dtoIn = dtoIn;

    if (validator(dtoIn)) {
      next();
      return;
    }

    const errors = validator.errors ?? [];
    const unsupported = errors
      .filter((e) => e.keyword === "additionalProperties")
      .map((e) => {
        const additional = (e.params as { additionalProperty?: string }).additionalProperty;
        return `${e.instancePath || ""}/${additional ?? ""}`.replace(/^\//, "");
      });

    if (unsupported.length > 0) {
      next(
        new ApiError({
          httpStatus: 400,
          code: ErrorCodes.UNSUPPORTED_KEYS,
          message: "Request body contains unsupported keys.",
          details: { unsupportedKeys: unsupported },
        })
      );
      return;
    }

    next(
      new ApiError({
        httpStatus: 400,
        code: ErrorCodes.INVALID_INPUT,
        message: "Request body failed validation.",
        details: { validationErrors: errors },
      })
    );
  };
}
