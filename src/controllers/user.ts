import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { config, Profiles, type Profile } from "../config.js";
import { users, type UserDoc } from "../db/collections.js";
import { ApiError, ErrorCodes } from "../utils/errors.js";
import { toObjectId } from "../utils/objectId.js";
import { ok } from "../utils/respond.js";
import { authedHandler, publicHandler } from "../utils/typedHandler.js";
import type { DeleteUserDtoIn, GetUserDtoIn, LoginUserDtoIn, RegisterUserDtoIn, UpdateUserDtoIn } from "../schemas/user.js";

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profiles: Profile[];
}

function profilesFor(isAdmin: boolean): Profile[] {
  return isAdmin ? [Profiles.USERS, Profiles.AUTHORITIES] : [Profiles.USERS];
}

function publicUser(doc: UserDoc): PublicUser {
  return {
    id: doc._id.toHexString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    profiles: profilesFor(doc.isAdmin),
  };
}

export const registerUser = publicHandler<RegisterUserDtoIn>(async (req, res) => {
  const { firstName, lastName, email, password } = req.dtoIn;
  const existing = await users().findOne({ email }, { projection: { _id: 1 } });
  if (existing) {
    throw new ApiError({
      httpStatus: 409,
      code: ErrorCodes.EMAIL_TAKEN,
      message: "A user with this email already exists.",
      details: { email },
    });
  }
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    firstName,
    lastName,
    email,
    passwordHash,
    isAdmin: email === config.adminEmail,
    createdAt: now,
    updatedAt: now,
  };
  await users().insertOne(doc);
  ok(res, req, publicUser(doc), 201);
});

export const loginUser = publicHandler<LoginUserDtoIn>(async (req, res) => {
  const { email, password } = req.dtoIn;
  const doc = await users().findOne({ email });
  if (!doc || !(await bcrypt.compare(password, doc.passwordHash))) {
    throw new ApiError({
      httpStatus: 401,
      code: ErrorCodes.NOT_AUTHENTICATED,
      message: "Invalid email or password.",
    });
  }
  const user = publicUser(doc);
  const token = jwt.sign({ sub: user.id, email: user.email, profiles: user.profiles }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  ok(res, req, { token, user });
});

export const getUser = authedHandler<GetUserDtoIn>(async (req, res) => {
  const targetId = req.dtoIn.id ? toObjectId(req.dtoIn.id) : toObjectId(req.user.id);
  const isAuthorities = req.user.profiles.includes(Profiles.AUTHORITIES);
  const isSelf = targetId.toHexString() === req.user.id;
  if (!isSelf && !isAuthorities) {
    throw new ApiError({
      httpStatus: 403,
      code: ErrorCodes.NOT_AUTHORIZED,
      message: "Users may only read their own account; reading other accounts requires Authorities.",
      details: { requestedId: targetId.toHexString(), callerId: req.user.id },
    });
  }
  const doc = await users().findOne({ _id: targetId });
  if (!doc) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "User not found.",
      details: { id: targetId.toHexString() },
    });
  }
  ok(res, req, publicUser(doc));
});

export const updateUser = authedHandler<UpdateUserDtoIn>(async (req, res) => {
  const targetId = req.dtoIn.id ? toObjectId(req.dtoIn.id) : toObjectId(req.user.id);
  const isAuthorities = req.user.profiles.includes(Profiles.AUTHORITIES);
  const isSelf = targetId.toHexString() === req.user.id;
  if (!isSelf && !isAuthorities) {
    throw new ApiError({
      httpStatus: 403,
      code: ErrorCodes.NOT_AUTHORIZED,
      message: "Users may only update their own account; updating other accounts requires Authorities.",
      details: { requestedId: targetId.toHexString(), callerId: req.user.id },
    });
  }

  const updates: Partial<Pick<UserDoc, "firstName" | "lastName" | "email" | "updatedAt">> = { updatedAt: new Date() };
  if (req.dtoIn.firstName !== undefined) updates.firstName = req.dtoIn.firstName;
  if (req.dtoIn.lastName !== undefined) updates.lastName = req.dtoIn.lastName;
  if (req.dtoIn.email !== undefined) {
    const collision = await users().findOne({ email: req.dtoIn.email, _id: { $ne: targetId } }, { projection: { _id: 1 } });
    if (collision) {
      throw new ApiError({
        httpStatus: 409,
        code: ErrorCodes.EMAIL_TAKEN,
        message: "A user with this email already exists.",
        details: { email: req.dtoIn.email },
      });
    }
    updates.email = req.dtoIn.email;
  }

  const result = await users().findOneAndUpdate({ _id: targetId }, { $set: updates }, { returnDocument: "after" });
  if (!result) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "User not found.",
      details: { id: targetId.toHexString() },
    });
  }
  ok(res, req, publicUser(result));
});

export const deleteUser = authedHandler<DeleteUserDtoIn>(async (req, res) => {
  const targetId = req.dtoIn.id ? toObjectId(req.dtoIn.id) : toObjectId(req.user.id);
  const isAuthorities = req.user.profiles.includes(Profiles.AUTHORITIES);
  const isSelf = targetId.toHexString() === req.user.id;
  if (!isSelf && !isAuthorities) {
    throw new ApiError({
      httpStatus: 403,
      code: ErrorCodes.NOT_AUTHORIZED,
      message: "Users may only delete their own account; deleting other accounts requires Authorities.",
      details: { requestedId: targetId.toHexString(), callerId: req.user.id },
    });
  }
  const result = await users().deleteOne({ _id: targetId });
  if (result.deletedCount === 0) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "User not found.",
      details: { id: targetId.toHexString() },
    });
  }
  ok(res, req, { id: targetId.toHexString(), deleted: true });
});
