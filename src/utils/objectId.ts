import { ObjectId } from "mongodb";
import { ApiError, ErrorCodes } from "./errors.js";

/**
 * Parses a 24-hex string into ObjectId. Throws ApiError(404) on a malformed id —
 * schema validation already rejected non-hex strings, so a failure here means
 * the id was syntactically valid but somehow couldn't be parsed.
 */
export function toObjectId(value: string, field = "id"): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw new ApiError({
      httpStatus: 400,
      code: ErrorCodes.INVALID_INPUT,
      message: `Field '${field}' is not a valid ObjectId.`,
      details: { field, value },
    });
  }
  return new ObjectId(value);
}
