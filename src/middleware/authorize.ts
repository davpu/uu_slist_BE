import type { RequestHandler } from "express";
import type { Profile } from "../config.js";
import { ApiError, ErrorCodes } from "../utils/errors.js";

/**
 * Profile-based authorization. The authenticated user must have at least one
 * of the allowed profiles.
 */
export function authorize(...allowedProfiles: Profile[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new ApiError({
          httpStatus: 401,
          code: ErrorCodes.NOT_AUTHENTICATED,
          message: "Authentication is required.",
        })
      );
      return;
    }
    const ok = req.user.profiles.some((p) => allowedProfiles.includes(p));
    if (!ok) {
      next(
        new ApiError({
          httpStatus: 403,
          code: ErrorCodes.NOT_AUTHORIZED,
          message: "User is not authorized to access this endpoint.",
          details: {
            requiredProfiles: allowedProfiles,
            userProfiles: req.user.profiles,
          },
        })
      );
      return;
    }
    next();
  };
}
