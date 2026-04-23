import "dotenv/config";

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
    readonly expiresIn: string;
  };
  readonly adminEmail: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
};
