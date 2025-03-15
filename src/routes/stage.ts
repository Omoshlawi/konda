import { Router } from "express";
import {
  addStage,
  deleteStage,
  getStage,
  getStages,
  patchStage,
  purgeStage,
  updateStage,
} from "../controllers/stages";
import { validateUUIDPathParam } from "@/middlewares";
import authenticate from "@/middlewares/authentication";

const router = Router({ mergeParams: true });

router.get("/", getStages);
router.post("/", [authenticate], addStage);
router.get("/:stageId", [validateUUIDPathParam("stageId")], getStage);
router.patch(
  "/:stageId",
  [validateUUIDPathParam("stageId"), authenticate],
  patchStage
);
router.put(
  "/:stageId",
  [validateUUIDPathParam("stageId"), authenticate],
  updateStage
);
router.delete(
  "/:stageId",
  [validateUUIDPathParam("stageId"), authenticate],
  deleteStage
);
router.purge(
  "/:stageId",
  [validateUUIDPathParam("stageId"), authenticate],
  purgeStage
);

export default router;
