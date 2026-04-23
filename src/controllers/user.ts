import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { config, Profiles, type Profile } from "../config.js";
import { ApiError, ErrorCodes } from "../utils/errors.js";
import { ok } from "../utils/respond.js";
import { authedHandler, publicHandler } from "../utils/typedHandler.js";
import type { DeleteUserDtoIn, GetUserDtoIn, LoginUserDtoIn, RegisterUserDtoIn, UpdateUserDtoIn } from "../schemas/user.js";

/**
 * HW #3: no persistence / business logic. Controllers validate input (via
 * middleware), enforce profile-level authorization (via middleware), and
 * echo dtoIn in the response envelope plus a stub `data` payload so the
 * client can see the expected response shape.
 */
const fakeObjectId = (): string => randomBytes(12).toString("hex");

export const registerUser = publicHandler<RegisterUserDtoIn>((req, res) => {
  const { firstName, lastName, email } = req.dtoIn;
  ok(res, req, { id: fakeObjectId(), firstName, lastName, email }, 201);
});

export const loginUser = publicHandler<LoginUserDtoIn>((req, res) => {
  const { email } = req.dtoIn;
  const profiles: Profile[] = email === config.adminEmail ? [Profiles.USERS, Profiles.AUTHORITIES] : [Profiles.USERS];
  const id = fakeObjectId();
  const token = jwt.sign({ sub: id, email, profiles }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
  ok(res, req, { token, user: { id, email, profiles } });
});

export const getUser = authedHandler<GetUserDtoIn>((req, res) => {
  const targetId = req.dtoIn.id ?? req.user.id;
  ok(res, req, {
    id: targetId,
    email: req.user.email,
    profiles: req.user.profiles,
  });
});

export const updateUser = authedHandler<UpdateUserDtoIn>((req, res) => {
  ok(res, req, { id: req.user.id, ...req.dtoIn });
});

export const deleteUser = authedHandler<DeleteUserDtoIn>((req, res, next) => {
  const targetId = req.dtoIn.id ?? req.user.id;
  const isAuthorities = req.user.profiles.includes(Profiles.AUTHORITIES);
  const isSelf = targetId === req.user.id;
  if (!isSelf && !isAuthorities) {
    next(
      new ApiError({
        httpStatus: 403,
        code: ErrorCodes.NOT_AUTHORIZED,
        message: "Users may only delete their own account; deleting other accounts requires Authorities.",
        details: { requestedId: targetId, callerId: req.user.id },
      })
    );
    return;
  }
  ok(res, req, { id: targetId, deleted: true });
});
