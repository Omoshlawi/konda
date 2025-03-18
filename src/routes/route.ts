import { Router } from "express";
import {
  addRoute,
  deleteRoute,
  getRoute,
  getRoutes,
  patchRoute,
  purgeRoute,
  updateRoute,
} from "../controllers/route";
import { validateUUIDPathParam } from "@/middlewares";
import authenticate from "@/middlewares/authentication";
import routestagesRouter from "./route-stage";
import routePricingRouter from "./route-pricing";

const router = Router({ mergeParams: true });

router.get("/", getRoutes);
router.post("/", [authenticate], addRoute);
router.get("/:routeId", [validateUUIDPathParam("routeId")], getRoute);
router.patch(
  "/:routeId",
  [validateUUIDPathParam("routeId"), authenticate],
  patchRoute
);
router.put(
  "/:routeId",
  [validateUUIDPathParam("routeId"), authenticate],
  updateRoute
);
router.delete(
  "/:routeId",
  [validateUUIDPathParam("routeId"), authenticate],
  deleteRoute
);
router.purge(
  "/:routeId",
  [validateUUIDPathParam("routeId"), authenticate],
  purgeRoute
);
router.use(
  "/:routeId/stages",
  [validateUUIDPathParam("routeId"), authenticate],
  routestagesRouter
);
router.use(
  "/:routeId/pricing",
  [validateUUIDPathParam("routeId"), authenticate],
  routePricingRouter
);

export default router;
