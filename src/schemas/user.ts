import type { FromSchema, JSONSchema } from "json-schema-to-ts";

const objectId = { type: "string", pattern: "^[a-f0-9]{24}$" } as const;
const email = { type: "string", format: "email", maxLength: 254 } as const;
const password = { type: "string", minLength: 8, maxLength: 128 } as const;
const personName = { type: "string", minLength: 1, maxLength: 50 } as const;

export const registerUserSchema = {
  type: "object",
  additionalProperties: false,
  required: ["firstName", "lastName", "email", "password"],
  properties: {
    firstName: personName,
    lastName: personName,
    email,
    password,
  },
} as const satisfies JSONSchema;

export type RegisterUserDtoIn = FromSchema<typeof registerUserSchema>;

export const loginUserSchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: { email, password },
} as const satisfies JSONSchema;

export type LoginUserDtoIn = FromSchema<typeof loginUserSchema>;

export const getUserSchema = {
  type: "object",
  additionalProperties: false,
  properties: { id: objectId },
} as const satisfies JSONSchema;

export type GetUserDtoIn = FromSchema<typeof getUserSchema>;

export const updateUserSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    firstName: personName,
    lastName: personName,
    email,
  },
} as const satisfies JSONSchema;

export type UpdateUserDtoIn = FromSchema<typeof updateUserSchema>;

export const deleteUserSchema = {
  type: "object",
  additionalProperties: false,
  properties: { id: objectId },
} as const satisfies JSONSchema;

export type DeleteUserDtoIn = FromSchema<typeof deleteUserSchema>;
