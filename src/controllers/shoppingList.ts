import { ObjectId, type Filter } from "mongodb";
import { Profiles } from "../config.js";
import { shoppingLists, users, type ItemDoc, type ShoppingListDoc } from "../db/collections.js";
import { ApiError, ErrorCodes } from "../utils/errors.js";
import { toObjectId } from "../utils/objectId.js";
import { ok } from "../utils/respond.js";
import { authedHandler, type AuthedRequest } from "../utils/typedHandler.js";
import type {
  AddMemberDtoIn,
  CreateItemDtoIn,
  CreateShoppingListDtoIn,
  DeleteItemDtoIn,
  DeleteShoppingListDtoIn,
  GetShoppingListDtoIn,
  LeaveShoppingListDtoIn,
  ListShoppingListsDtoIn,
  RemoveMemberDtoIn,
  SetItemCompletedDtoIn,
  UpdateItemDtoIn,
  UpdateShoppingListDtoIn,
} from "../schemas/shoppingList.js";

type AccessLevel = "owner" | "memberOrOwner";

function notFound(id: ObjectId): ApiError {
  return new ApiError({
    httpStatus: 404,
    code: ErrorCodes.NOT_FOUND,
    message: "Shopping list not found.",
    details: { id: id.toHexString() },
  });
}

function notAuthorizedForList(level: AccessLevel, id: ObjectId): ApiError {
  return new ApiError({
    httpStatus: 403,
    code: ErrorCodes.NOT_AUTHORIZED,
    message: level === "owner" ? "Only the list owner may perform this operation." : "Only the owner or a member may access this list.",
    details: { listId: id.toHexString(), required: level },
  });
}

async function loadList(req: AuthedRequest<unknown>, listId: ObjectId, level: AccessLevel): Promise<ShoppingListDoc> {
  const doc = await shoppingLists().findOne({ _id: listId });
  if (!doc) throw notFound(listId);
  if (req.user.profiles.includes(Profiles.AUTHORITIES)) return doc;
  const callerId = toObjectId(req.user.id);
  const isOwner = doc.ownerId.equals(callerId);
  const isMember = doc.memberList.some((m) => m.equals(callerId));
  const permitted = level === "owner" ? isOwner : isOwner || isMember;
  if (!permitted) throw notAuthorizedForList(level, listId);
  return doc;
}

function serializeItem(item: ItemDoc): {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  completed: boolean;
} {
  return {
    id: item._id.toHexString(),
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    completed: item.completed,
  };
}

function serializeList(doc: ShoppingListDoc): {
  id: string;
  name: string;
  ownerId: string;
  memberList: string[];
  itemList: ReturnType<typeof serializeItem>[];
} {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    ownerId: doc.ownerId.toHexString(),
    memberList: doc.memberList.map((m) => m.toHexString()),
    itemList: doc.itemList.map(serializeItem),
  };
}

// --- Shopping lists ---

export const createShoppingList = authedHandler<CreateShoppingListDtoIn>(async (req, res) => {
  const ownerId = toObjectId(req.user.id);
  const now = new Date();
  const doc: ShoppingListDoc = {
    _id: new ObjectId(),
    name: req.dtoIn.name,
    ownerId,
    memberList: [],
    itemList: [],
    createdAt: now,
    updatedAt: now,
  };
  await shoppingLists().insertOne(doc);
  ok(res, req, serializeList(doc), 201);
});

export const listShoppingLists = authedHandler<ListShoppingListsDtoIn>(async (req, res) => {
  const role = req.dtoIn.role ?? "any";
  const pageIndex = req.dtoIn.pageIndex ?? 0;
  const pageSize = req.dtoIn.pageSize ?? 20;
  const isAuthorities = req.user.profiles.includes(Profiles.AUTHORITIES);
  const callerId = toObjectId(req.user.id);

  let filter: Filter<ShoppingListDoc> = {};
  if (role === "owner") {
    filter = { ownerId: callerId };
  } else if (role === "member") {
    filter = { memberList: callerId };
  } else if (!isAuthorities) {
    filter = { $or: [{ ownerId: callerId }, { memberList: callerId }] };
  }

  const total = await shoppingLists().countDocuments(filter);
  const docs = await shoppingLists()
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(pageIndex * pageSize)
    .limit(pageSize)
    .toArray();

  ok(res, req, {
    itemList: docs.map(serializeList),
    pageInfo: { pageIndex, pageSize, total },
  });
});

export const getShoppingList = authedHandler<GetShoppingListDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  const doc = await loadList(req, listId, "memberOrOwner");
  ok(res, req, serializeList(doc));
});

export const updateShoppingList = authedHandler<UpdateShoppingListDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  await loadList(req, listId, "owner");
  const update: Partial<Pick<ShoppingListDoc, "name" | "updatedAt">> = { updatedAt: new Date() };
  if (req.dtoIn.name !== undefined) update.name = req.dtoIn.name;
  const result = await shoppingLists().findOneAndUpdate({ _id: listId }, { $set: update }, { returnDocument: "after" });
  if (!result) throw notFound(listId);
  ok(res, req, serializeList(result));
});

export const deleteShoppingList = authedHandler<DeleteShoppingListDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  await loadList(req, listId, "owner");
  const result = await shoppingLists().findOneAndDelete({ _id: listId });
  if (!result) throw notFound(listId);
  ok(res, req, { id: listId.toHexString(), deleted: true });
});

// --- Membership ---

export const addMember = authedHandler<AddMemberDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  const userId = toObjectId(req.dtoIn.userId, "userId");
  const list = await loadList(req, listId, "owner");
  if (list.ownerId.equals(userId)) {
    throw new ApiError({
      httpStatus: 409,
      code: ErrorCodes.CONFLICT,
      message: "The owner cannot also be a member.",
      details: { listId: listId.toHexString(), userId: userId.toHexString() },
    });
  }
  const userExists = await users().findOne({ _id: userId }, { projection: { _id: 1 } });
  if (!userExists) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "User to add not found.",
      details: { userId: userId.toHexString() },
    });
  }
  await shoppingLists().updateOne({ _id: listId }, { $addToSet: { memberList: userId }, $set: { updatedAt: new Date() } });
  ok(res, req, { id: listId.toHexString(), addedUserId: userId.toHexString() });
});

export const removeMember = authedHandler<RemoveMemberDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  const userId = toObjectId(req.dtoIn.userId, "userId");
  const list = await loadList(req, listId, "owner");
  const isMember = list.memberList.some((m) => m.equals(userId));
  if (!isMember) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "User is not a member of this list.",
      details: { listId: listId.toHexString(), userId: userId.toHexString() },
    });
  }
  await shoppingLists().updateOne({ _id: listId }, { $pull: { memberList: userId }, $set: { updatedAt: new Date() } });
  ok(res, req, { id: listId.toHexString(), removedUserId: userId.toHexString() });
});

export const leaveShoppingList = authedHandler<LeaveShoppingListDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.id);
  const callerId = toObjectId(req.user.id);
  const doc = await shoppingLists().findOne({ _id: listId });
  if (!doc) throw notFound(listId);
  if (doc.ownerId.equals(callerId)) {
    throw new ApiError({
      httpStatus: 409,
      code: ErrorCodes.CONFLICT,
      message: "The owner cannot leave their own list. Delete it or transfer ownership instead.",
      details: { listId: listId.toHexString() },
    });
  }
  if (!doc.memberList.some((m) => m.equals(callerId))) {
    throw new ApiError({
      httpStatus: 403,
      code: ErrorCodes.NOT_AUTHORIZED,
      message: "Caller is not a member of this list.",
      details: { listId: listId.toHexString() },
    });
  }
  await shoppingLists().updateOne({ _id: listId }, { $pull: { memberList: callerId }, $set: { updatedAt: new Date() } });
  ok(res, req, { id: listId.toHexString(), leftUserId: callerId.toHexString() });
});

// --- Items ---

export const createItem = authedHandler<CreateItemDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.listId, "listId");
  await loadList(req, listId, "memberOrOwner");
  const now = new Date();
  const item: ItemDoc = {
    _id: new ObjectId(),
    name: req.dtoIn.name,
    amount: req.dtoIn.amount ?? null,
    unit: req.dtoIn.unit ?? null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  await shoppingLists().updateOne({ _id: listId }, { $push: { itemList: item }, $set: { updatedAt: now } });
  ok(res, req, { listId: listId.toHexString(), item: serializeItem(item) }, 201);
});

export const updateItem = authedHandler<UpdateItemDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.listId, "listId");
  const itemId = toObjectId(req.dtoIn.itemId, "itemId");
  await loadList(req, listId, "memberOrOwner");
  const now = new Date();
  const set: Record<string, unknown> = { "itemList.$.updatedAt": now, updatedAt: now };
  if (req.dtoIn.name !== undefined) set["itemList.$.name"] = req.dtoIn.name;
  if (req.dtoIn.amount !== undefined) set["itemList.$.amount"] = req.dtoIn.amount;
  if (req.dtoIn.unit !== undefined) set["itemList.$.unit"] = req.dtoIn.unit;

  const result = await shoppingLists().findOneAndUpdate(
    { _id: listId, "itemList._id": itemId },
    { $set: set },
    { returnDocument: "after" }
  );
  if (!result) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "Item not found in this list.",
      details: { listId: listId.toHexString(), itemId: itemId.toHexString() },
    });
  }
  const updated = result.itemList.find((i) => i._id.equals(itemId));
  if (!updated) throw notFound(itemId);
  ok(res, req, { listId: listId.toHexString(), item: serializeItem(updated) });
});

export const deleteItem = authedHandler<DeleteItemDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.listId, "listId");
  const itemId = toObjectId(req.dtoIn.itemId, "itemId");
  await loadList(req, listId, "memberOrOwner");
  const result = await shoppingLists().updateOne(
    { _id: listId },
    { $pull: { itemList: { _id: itemId } }, $set: { updatedAt: new Date() } }
  );
  if (result.modifiedCount === 0) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "Item not found in this list.",
      details: { listId: listId.toHexString(), itemId: itemId.toHexString() },
    });
  }
  ok(res, req, { listId: listId.toHexString(), itemId: itemId.toHexString(), deleted: true });
});

export const setItemCompleted = authedHandler<SetItemCompletedDtoIn>(async (req, res) => {
  const listId = toObjectId(req.dtoIn.listId, "listId");
  const itemId = toObjectId(req.dtoIn.itemId, "itemId");
  await loadList(req, listId, "memberOrOwner");
  const now = new Date();
  const result = await shoppingLists().updateOne(
    { _id: listId, "itemList._id": itemId },
    { $set: { "itemList.$.completed": req.dtoIn.completed, "itemList.$.updatedAt": now, updatedAt: now } }
  );
  if (result.matchedCount === 0) {
    throw new ApiError({
      httpStatus: 404,
      code: ErrorCodes.NOT_FOUND,
      message: "Item not found in this list.",
      details: { listId: listId.toHexString(), itemId: itemId.toHexString() },
    });
  }
  ok(res, req, {
    listId: listId.toHexString(),
    itemId: itemId.toHexString(),
    completed: req.dtoIn.completed,
  });
});
