import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config, type Profile } from "../config.js";
import { ApiError, ErrorCodes } from "../utils/errors.js";

interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  profiles: Profile[];
}

function isAuthPayload(value: unknown): value is AuthTokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sub === "string" && typeof v.email === "string" && Array.isArray(v.profiles) && v.profiles.every((p) => typeof p === "string")
  );
}

/**
 * Verifies a Bearer JWT and attaches `req.user`.
 */
export function authenticate(): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (!token || scheme !== "Bearer") {
      next(
        new ApiError({
          httpStatus: 401,
          code: ErrorCodes.NOT_AUTHENTICATED,
          message: "Missing or malformed Authorization header (expected 'Bearer <token>').",
        })
      );
      return;
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret);
      if (!isAuthPayload(payload)) {
        next(
          new ApiError({
            httpStatus: 401,
            code: ErrorCodes.INVALID_TOKEN,
            message: "JWT payload has an unexpected shape.",
          })
        );
        return;
      }
      req.user = {
        id: payload.sub,
        email: payload.email,
        profiles: payload.profiles,
      };
      next();
    } catch {
      next(
        new ApiError({
          httpStatus: 401,
          code: ErrorCodes.INVALID_TOKEN,
          message: "JWT is invalid or expired.",
        })
      );
    }
  };
}
