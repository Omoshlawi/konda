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

const router = Router({ mergeParams: true });

router.get("/", getRoutes);
router.post("/", addRoute);
router.get("/:routeId", [validateUUIDPathParam("routeId")], getRoute);
router.patch("/:routeId", [validateUUIDPathParam("routeId")], patchRoute);
router.put("/:routeId", [validateUUIDPathParam("routeId")], updateRoute);
router.delete("/:routeId", [validateUUIDPathParam("routeId")], deleteRoute);
router.purge("/:routeId", [validateUUIDPathParam("routeId")], purgeRoute);

export default router;
