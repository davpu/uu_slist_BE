import "dotenv/config";
import type jwt from "jsonwebtoken";

export const Profiles = {
  PUBLIC: "Public",
  USERS: "Users",
  AUTHORITIES: "Authorities",
} as const;

export type Profile = (typeof Profiles)[keyof typeof Profiles];

export interface AppConfig {
  readonly port: number;
  readonly jwt: {
    readonly secret: string;
    readonly expiresIn: jwt.SignOptions["expiresIn"];
  };
  readonly adminEmail: string;
  readonly mongo: {
    readonly uri: string;
    readonly dbName: string;
  };
  readonly bcryptRounds: number;
}

const DEV_JWT_SECRET = "dev-secret-change-me";

function nonNegativeInt(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Config: ${name} must be a non-negative integer (got "${raw}").`);
  }
  return n;
}

function jwtSecret(): string {
  const provided = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!provided || provided === DEV_JWT_SECRET)) {
    throw new Error("Config: JWT_SECRET must be set to a non-default value in production.");
  }
  return provided ?? DEV_JWT_SECRET;
}

export const config: AppConfig = {
  port: nonNegativeInt("PORT", process.env.PORT, 3000),
  jwt: {
    secret: jwtSecret(),
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as jwt.SignOptions["expiresIn"],
  },
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
  mongo: {
    uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
    dbName: process.env.MONGODB_DB ?? "uu_slist",
  },
  bcryptRounds: nonNegativeInt("BCRYPT_ROUNDS", process.env.BCRYPT_ROUNDS, 10),
};
