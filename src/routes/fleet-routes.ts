import { Router } from "express";
import {
  activateFleetRoute,
  addFleetRoute,
  deleteFleetRoute,
  getFleetRoute,
  getFleetRoutes,
  patchFleetRoute,
  purgeFleetRoute,
  updateFleetRoute,
} from "../controllers/fleet-routes";
import { validateUUIDPathParam } from "@/middlewares";
import authenticate from "@/middlewares/authentication";

const router = Router({ mergeParams: true });

router.get("/", getFleetRoutes);
router.post("/", [authenticate], addFleetRoute);
router.get(
  "/:fleetRouteId",
  [validateUUIDPathParam("fleetRouteId")],
  getFleetRoute
);
router.patch(
  "/:fleetRouteId",
  [validateUUIDPathParam("fleetRouteId"), authenticate],
  patchFleetRoute
);
router.put(
  "/:fleetRouteId",
  [validateUUIDPathParam("fleetRouteId"), authenticate],
  updateFleetRoute
);
router.delete(
  "/:fleetRouteId",
  [validateUUIDPathParam("fleetRouteId"), authenticate],
  deleteFleetRoute
);
router.purge(
  "/:fleetRouteId",
  [validateUUIDPathParam("fleetRouteId"), authenticate],
  purgeFleetRoute
);

router.put(
  "/:fleetRouteId/activate",
  [validateUUIDPathParam("fleetRouteId"), authenticate],
  activateFleetRoute
);

export default router;
