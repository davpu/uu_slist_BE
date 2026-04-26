import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./client.js";

export interface UserDoc {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemDoc {
  _id: ObjectId;
  name: string;
  amount: number | null;
  unit: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListDoc {
  _id: ObjectId;
  name: string;
  ownerId: ObjectId;
  memberList: ObjectId[];
  itemList: ItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

export const users = (): Collection<UserDoc> => getDb().collection<UserDoc>("users");
export const shoppingLists = (): Collection<ShoppingListDoc> => getDb().collection<ShoppingListDoc>("shoppingLists");

export async function ensureIndexes(): Promise<void> {
  await users().createIndex({ email: 1 }, { unique: true });
  await shoppingLists().createIndex({ ownerId: 1 });
  await shoppingLists().createIndex({ memberList: 1 });
}
