export const ErrorCodes = {
  INVALID_INPUT: "invalidInput",
  UNSUPPORTED_KEYS: "unsupportedKeys",
  NOT_AUTHENTICATED: "notAuthenticated",
  INVALID_TOKEN: "invalidToken",
  NOT_AUTHORIZED: "notAuthorized",
  NOT_FOUND: "notFound",
  EMAIL_TAKEN: "emailTaken",
  CONFLICT: "conflict",
  UNEXPECTED: "unexpectedError",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorMapEntry {
  message: string;
  details: Record<string, unknown>;
}

export type ErrorMap = Record<string, ErrorMapEntry>;

export interface ApiErrorInit {
  httpStatus?: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly code: ErrorCode;
  readonly details: Record<string, unknown>;

  constructor({ httpStatus = 400, code, message, details = {} }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
  }

  toErrorMap(): ErrorMap {
    return { [this.code]: { message: this.message, details: this.details } };
  }
}
