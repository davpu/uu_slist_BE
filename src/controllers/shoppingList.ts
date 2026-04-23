import { randomBytes } from "node:crypto";
import { ok } from "../utils/respond.js";
import { authedHandler } from "../utils/typedHandler.js";
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

/**
 * HW #3: no persistence / business logic. Instance-level authorization
 * (list Owner / Member) would live here once a data layer exists — for now
 * only profile-level auth is enforced by middleware.
 */
const fakeObjectId = (): string => randomBytes(12).toString("hex");

// --- Shopping lists ---

export const createShoppingList = authedHandler<CreateShoppingListDtoIn>((req, res) => {
  ok(
    res,
    req,
    {
      id: fakeObjectId(),
      name: req.dtoIn.name,
      ownerId: req.user.id,
      memberList: [],
      itemList: [],
    },
    201
  );
});

export const listShoppingLists = authedHandler<ListShoppingListsDtoIn>((req, res) => {
  ok(res, req, {
    itemList: [],
    pageInfo: {
      pageIndex: req.dtoIn.pageIndex ?? 0,
      pageSize: req.dtoIn.pageSize ?? 20,
      total: 0,
    },
  });
});

export const getShoppingList = authedHandler<GetShoppingListDtoIn>((req, res) => {
  ok(res, req, {
    id: req.dtoIn.id,
    name: "<echo — no data layer yet>",
    ownerId: req.user.id,
    memberList: [],
    itemList: [],
  });
});

export const updateShoppingList = authedHandler<UpdateShoppingListDtoIn>((req, res) => {
  ok(res, req, {
    id: req.dtoIn.id,
    name: req.dtoIn.name ?? "<unchanged>",
    ownerId: req.user.id,
  });
});

export const deleteShoppingList = authedHandler<DeleteShoppingListDtoIn>((req, res) => {
  ok(res, req, { id: req.dtoIn.id, deleted: true });
});

// --- Membership ---

export const addMember = authedHandler<AddMemberDtoIn>((req, res) => {
  ok(res, req, { id: req.dtoIn.id, addedUserId: req.dtoIn.userId });
});

export const removeMember = authedHandler<RemoveMemberDtoIn>((req, res) => {
  ok(res, req, { id: req.dtoIn.id, removedUserId: req.dtoIn.userId });
});

export const leaveShoppingList = authedHandler<LeaveShoppingListDtoIn>((req, res) => {
  ok(res, req, { id: req.dtoIn.id, leftUserId: req.user.id });
});

// --- Items ---

export const createItem = authedHandler<CreateItemDtoIn>((req, res) => {
  ok(
    res,
    req,
    {
      listId: req.dtoIn.listId,
      item: {
        id: fakeObjectId(),
        name: req.dtoIn.name,
        amount: req.dtoIn.amount ?? null,
        unit: req.dtoIn.unit ?? null,
        completed: false,
      },
    },
    201
  );
});

export const updateItem = authedHandler<UpdateItemDtoIn>((req, res) => {
  const { listId, itemId, name, amount, unit } = req.dtoIn;
  ok(res, req, {
    listId,
    item: { id: itemId, name, amount, unit },
  });
});

export const deleteItem = authedHandler<DeleteItemDtoIn>((req, res) => {
  ok(res, req, {
    listId: req.dtoIn.listId,
    itemId: req.dtoIn.itemId,
    deleted: true,
  });
});

export const setItemCompleted = authedHandler<SetItemCompletedDtoIn>((req, res) => {
  ok(res, req, {
    listId: req.dtoIn.listId,
    itemId: req.dtoIn.itemId,
    completed: req.dtoIn.completed,
  });
});
