import { Router } from "express";
import {
  addNotificationReminder,
  deleteNotificationReminder,
  getNotificationReminder,
  getNotificationReminders,
  patchNotificationReminder,
  purgeNotificationReminder,
  updateNotificationReminder,
} from "../controllers/notification-reminders";
import { validateUUIDPathParam } from "@/middlewares";

const router = Router({ mergeParams: true });

router.get("/", getNotificationReminders);
router.post("/", addNotificationReminder);
router.get(
  "/:reminderId",
  [validateUUIDPathParam("reminderId")],
  getNotificationReminder
);
router.patch(
  "/:reminderId",
  [validateUUIDPathParam("reminderId")],
  patchNotificationReminder
);
router.put(
  "/:reminderId",
  [validateUUIDPathParam("reminderId")],
  updateNotificationReminder
);
router.delete(
  "/:reminderId",
  [validateUUIDPathParam("reminderId")],
  deleteNotificationReminder
);
router.purge(
  "/:reminderId",
  [validateUUIDPathParam("reminderId")],
  purgeNotificationReminder
);

export default router;
