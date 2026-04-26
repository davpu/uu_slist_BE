import { MongoClient, type Db } from "mongodb";
import { config } from "../config.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(config.mongo.uri);
  await client.connect();
  db = client.db(config.mongo.dbName);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("MongoDB not connected. Call connect() first.");
  return db;
}

export async function close(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
