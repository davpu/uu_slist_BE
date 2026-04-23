import type { FromSchema, JSONSchema } from "json-schema-to-ts";

const objectId = { type: "string", pattern: "^[a-f0-9]{24}$" } as const;
const listName = { type: "string", minLength: 1, maxLength: 100 } as const;
const itemName = { type: "string", minLength: 1, maxLength: 100 } as const;
const unit = { type: "string", minLength: 1, maxLength: 20 } as const;
const amount = { type: "number", exclusiveMinimum: 0, maximum: 1_000_000 } as const;

export const createShoppingListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: { name: listName },
} as const satisfies JSONSchema;
export type CreateShoppingListDtoIn = FromSchema<typeof createShoppingListSchema>;

export const listShoppingListsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    role: { type: "string", enum: ["owner", "member", "any"] },
    pageIndex: { type: "integer", minimum: 0 },
    pageSize: { type: "integer", minimum: 1, maximum: 100 },
  },
} as const satisfies JSONSchema;
export type ListShoppingListsDtoIn = FromSchema<typeof listShoppingListsSchema>;

export const getShoppingListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: objectId },
} as const satisfies JSONSchema;
export type GetShoppingListDtoIn = FromSchema<typeof getShoppingListSchema>;

export const updateShoppingListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: objectId, name: listName },
} as const satisfies JSONSchema;
export type UpdateShoppingListDtoIn = FromSchema<typeof updateShoppingListSchema>;

export const deleteShoppingListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: objectId },
} as const satisfies JSONSchema;
export type DeleteShoppingListDtoIn = FromSchema<typeof deleteShoppingListSchema>;

export const addMemberSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "userId"],
  properties: { id: objectId, userId: objectId },
} as const satisfies JSONSchema;
export type AddMemberDtoIn = FromSchema<typeof addMemberSchema>;

export const removeMemberSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "userId"],
  properties: { id: objectId, userId: objectId },
} as const satisfies JSONSchema;
export type RemoveMemberDtoIn = FromSchema<typeof removeMemberSchema>;

export const leaveShoppingListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: objectId },
} as const satisfies JSONSchema;
export type LeaveShoppingListDtoIn = FromSchema<typeof leaveShoppingListSchema>;

export const createItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["listId", "name"],
  properties: {
    listId: objectId,
    name: itemName,
    amount,
    unit,
  },
} as const satisfies JSONSchema;
export type CreateItemDtoIn = FromSchema<typeof createItemSchema>;

export const updateItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["listId", "itemId"],
  properties: {
    listId: objectId,
    itemId: objectId,
    name: itemName,
    amount,
    unit,
  },
} as const satisfies JSONSchema;
export type UpdateItemDtoIn = FromSchema<typeof updateItemSchema>;

export const deleteItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["listId", "itemId"],
  properties: { listId: objectId, itemId: objectId },
} as const satisfies JSONSchema;
export type DeleteItemDtoIn = FromSchema<typeof deleteItemSchema>;

export const setItemCompletedSchema = {
  type: "object",
  additionalProperties: false,
  required: ["listId", "itemId", "completed"],
  properties: {
    listId: objectId,
    itemId: objectId,
    completed: { type: "boolean" },
  },
} as const satisfies JSONSchema;
export type SetItemCompletedDtoIn = FromSchema<typeof setItemCompletedSchema>;
