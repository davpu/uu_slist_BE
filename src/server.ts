import { createApp } from "./app.js";
import { config } from "./config.js";
import { close as dbClose, connect as dbConnect } from "./db/client.js";
import { ensureIndexes } from "./db/collections.js";

async function main(): Promise<void> {
  await dbConnect();
  await ensureIndexes();

  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[uu-slist-be] listening on http://localhost:${config.port} (db=${config.mongo.dbName})`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(`[uu-slist-be] received ${signal}, shutting down`);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await dbClose();
    process.exit(exitCode);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("[uu-slist-be] unhandledRejection", reason);
    void shutdown("unhandledRejection", 1);
  });
  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("[uu-slist-be] uncaughtException", err);
    void shutdown("uncaughtException", 1);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[uu-slist-be] failed to start", err);
  process.exit(1);
});
