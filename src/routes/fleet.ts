import { Router } from "express";
import {
  addFleet,
  deleteFleet,
  getFleet,
  getFleets,
  patchFleet,
  purgeFleet,
  updateFleet,
} from "../controllers/fleets";
import { validateUUIDPathParam } from "@/middlewares";
import authenticate from "@/middlewares/authentication";

const router = Router({ mergeParams: true });

router.get("/", getFleets);
router.post("/", [authenticate], addFleet);
router.get("/:fleetId", [validateUUIDPathParam("fleetId")], getFleet);
router.patch(
  "/:fleetId",
  [validateUUIDPathParam("fleetId"), authenticate],
  patchFleet
);
router.put(
  "/:fleetId",
  [validateUUIDPathParam("fleetId"), authenticate],
  updateFleet
);
router.delete(
  "/:fleetId",
  [validateUUIDPathParam("fleetId"), authenticate],
  deleteFleet
);
router.purge(
  "/:fleetId",
  [validateUUIDPathParam("fleetId"), authenticate],
  purgeFleet
);

export default router;
