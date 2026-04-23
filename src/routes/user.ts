import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { Profiles } from "../config.js";
import { deleteUserSchema, getUserSchema, loginUserSchema, registerUserSchema, updateUserSchema } from "../schemas/user.js";
import * as controller from "../controllers/user.js";

const router = Router();

// Public
router.post("/register", validateBody(registerUserSchema), controller.registerUser);
router.post("/login", validateBody(loginUserSchema), controller.loginUser);

// Authenticated
router.post("/get", authenticate(), authorize(Profiles.USERS, Profiles.AUTHORITIES), validateBody(getUserSchema), controller.getUser);

router.post(
  "/update",
  authenticate(),
  authorize(Profiles.USERS, Profiles.AUTHORITIES),
  validateBody(updateUserSchema),
  controller.updateUser
);

router.post(
  "/delete",
  authenticate(),
  authorize(Profiles.USERS, Profiles.AUTHORITIES),
  validateBody(deleteUserSchema),
  controller.deleteUser
);

export default router;
