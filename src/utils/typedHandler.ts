import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthUser } from "../types/express.js";

export type AuthedRequest<DtoIn = unknown> = Request & {
  user: AuthUser;
  dtoIn: DtoIn;
};

export type PublicRequest<DtoIn = unknown> = Request & {
  dtoIn: DtoIn;
};

type AsyncOrSync<T> = T | Promise<T>;

/**
 * Handler for authenticated routes. The caller guarantees that
 * `authenticate()` + `authorize(...)` + `validateBody(...)` ran first,
 * so `user` and `dtoIn` are non-null and correctly typed.
 */
export function authedHandler<DtoIn>(
  fn: (req: AuthedRequest<DtoIn>, res: Response, next: NextFunction) => AsyncOrSync<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthedRequest<DtoIn>, res, next)).catch(next);
  };
}

/**
 * Handler for public routes. The caller guarantees `validateBody(...)` ran,
 * so `dtoIn` is non-null and correctly typed.
 */
export function publicHandler<DtoIn>(
  fn: (req: PublicRequest<DtoIn>, res: Response, next: NextFunction) => AsyncOrSync<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as PublicRequest<DtoIn>, res, next)).catch(next);
  };
}
