import { Router } from "express";
import {
  addRouteStage,
  deleteRouteStage,
  getRouteStage,
  getRouteStages,
  patchRouteStage,
  purgeRouteStage,
  updateRouteStage,
} from "../controllers/route-stage";
import { validateUUIDPathParam } from "@/middlewares";

const router = Router({ mergeParams: true });

router.get("/", getRouteStages);
router.post("/", addRouteStage);
router.get(
  "/:routeStageId",
  [validateUUIDPathParam("routeStageId")],
  getRouteStage
);
router.patch(
  "/:routeStageId",
  [validateUUIDPathParam("routeStageId")],
  patchRouteStage
);
router.put(
  "/:routeStageId",
  [validateUUIDPathParam("routeStageId")],
  updateRouteStage
);
router.delete(
  "/:routeStageId",
  [validateUUIDPathParam("routeStageId")],
  deleteRouteStage
);
router.purge(
  "/:routeStageId",
  [validateUUIDPathParam("routeStageId")],
  purgeRouteStage
);

export default router;
