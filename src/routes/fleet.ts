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

const router = Router({ mergeParams: true });

router.get("/", getFleets);
router.post("/", addFleet);
router.get("/:fleetId", [validateUUIDPathParam("fleetId")], getFleet);
router.patch("/:fleetId", [validateUUIDPathParam("fleetId")], patchFleet);
router.put("/:fleetId", [validateUUIDPathParam("fleetId")], updateFleet);
router.delete("/:fleetId", [validateUUIDPathParam("fleetId")], deleteFleet);
router.purge("/:fleetId", [validateUUIDPathParam("fleetId")], purgeFleet);

export default router;
