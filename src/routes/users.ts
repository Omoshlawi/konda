import {
  getUser,
  getUserByToken,
  getUsers,
  updateUserPushToken,
} from "@/controllers/users";
import authenticate from "@/middlewares/authentication";
import { Router } from "express";

const router = Router();

router.get("/", getUsers);
router.get("/profile", authenticate, getUserByToken); // Profile has higher priotity to uuid
router.put("/push-token", authenticate, updateUserPushToken); // Profile has higher priotity to uuid
router.get("/:userId", getUser);

export default router;
