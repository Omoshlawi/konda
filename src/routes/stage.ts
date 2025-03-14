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

const router = Router({ mergeParams: true });

router.get("/", getStages);
router.post("/", addStage);
router.get("/:stageId", [validateUUIDPathParam("stageId")], getStage);
router.patch("/:stageId", [validateUUIDPathParam("stageId")], patchStage);
router.put("/:stageId", [validateUUIDPathParam("stageId")], updateStage);
router.delete("/:stageId", [validateUUIDPathParam("stageId")], deleteStage);
router.purge("/:stageId", [validateUUIDPathParam("stageId")], purgeStage);

export default router;
