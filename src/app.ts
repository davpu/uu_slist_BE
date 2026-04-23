import express, { type Express } from "express";
import userRouter from "./routes/user.js";
import shoppingListRouter from "./routes/shoppingList.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      name: "uu-slist-be",
      description:
        "Shopping list backend (BBSY HW #3). Endpoints validate dtoIn, authenticate/authorize, and echo received input along with errorMap in dtoOut.",
    });
  });

  app.use("/user", userRouter);
  app.use("/shoppingList", shoppingListRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
