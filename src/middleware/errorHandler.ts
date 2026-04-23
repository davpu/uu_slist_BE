import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError, ErrorCodes, type ErrorMap } from "../utils/errors.js";

interface FailureEnvelope {
  dtoIn: unknown;
  errorMap: ErrorMap;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: FailureEnvelope = {
    dtoIn: req.body ?? {},
    errorMap: {
      [ErrorCodes.NOT_FOUND]: {
        message: `Route ${req.method} ${req.originalUrl} not found.`,
        details: {},
      },
    },
  };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    const body: FailureEnvelope = {
      dtoIn: req.dtoIn ?? req.body ?? {},
      errorMap: err.toErrorMap(),
    };
    res.status(err.httpStatus).json(body);
    return;
  }
  // Unknown error — never leak internals
  // eslint-disable-next-line no-console
  console.error("[unhandled]", err);
  const body: FailureEnvelope = {
    dtoIn: req.dtoIn ?? req.body ?? {},
    errorMap: {
      [ErrorCodes.UNEXPECTED]: {
        message: "Unexpected server error.",
        details: {},
      },
    },
  };
  res.status(500).json(body);
};
