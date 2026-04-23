import { Router, type RequestHandler } from "express";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { Profiles } from "../config.js";
import {
  addMemberSchema,
  createItemSchema,
  createShoppingListSchema,
  deleteItemSchema,
  deleteShoppingListSchema,
  getShoppingListSchema,
  leaveShoppingListSchema,
  listShoppingListsSchema,
  removeMemberSchema,
  setItemCompletedSchema,
  updateItemSchema,
  updateShoppingListSchema,
} from "../schemas/shoppingList.js";
import * as controller from "../controllers/shoppingList.js";

const router = Router();

// All shoppingList endpoints require authentication + (Users | Authorities)
const auth: RequestHandler[] = [authenticate(), authorize(Profiles.USERS, Profiles.AUTHORITIES)];

router.post("/create", ...auth, validateBody(createShoppingListSchema), controller.createShoppingList);
router.post("/list", ...auth, validateBody(listShoppingListsSchema), controller.listShoppingLists);
router.post("/get", ...auth, validateBody(getShoppingListSchema), controller.getShoppingList);
router.post("/update", ...auth, validateBody(updateShoppingListSchema), controller.updateShoppingList);
router.post("/delete", ...auth, validateBody(deleteShoppingListSchema), controller.deleteShoppingList);

router.post("/addMember", ...auth, validateBody(addMemberSchema), controller.addMember);
router.post("/removeMember", ...auth, validateBody(removeMemberSchema), controller.removeMember);
router.post("/leave", ...auth, validateBody(leaveShoppingListSchema), controller.leaveShoppingList);

router.post("/item/create", ...auth, validateBody(createItemSchema), controller.createItem);
router.post("/item/update", ...auth, validateBody(updateItemSchema), controller.updateItem);
router.post("/item/delete", ...auth, validateBody(deleteItemSchema), controller.deleteItem);
router.post("/item/setCompleted", ...auth, validateBody(setItemCompletedSchema), controller.setItemCompleted);

export default router;
