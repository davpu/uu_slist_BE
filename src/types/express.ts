import type { Profile } from "../config.js";

export interface AuthUser {
  id: string;
  email: string;
  profiles: Profile[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      dtoIn?: unknown;
    }
  }
}

export {};
