import { Router } from "express";
import {
  addRoutePricing,
  deleteRoutePricing,
  getRoutePricing,
  getRoutePricings,
  patchRoutePricing,
  purgeRoutePricing,
  updateRoutePricing,
} from "../controllers/route-pricing";
import { validateUUIDPathParam } from "@/middlewares";

const router = Router({ mergeParams: true });

router.get("/", getRoutePricings);
router.post("/", addRoutePricing);
router.get(
  "/:routePricingId",
  [validateUUIDPathParam("routePricingId")],
  getRoutePricing
);
router.patch(
  "/:routePricingId",
  [validateUUIDPathParam("routePricingId")],
  patchRoutePricing
);
router.put(
  "/:routePricingId",
  [validateUUIDPathParam("routePricingId")],
  updateRoutePricing
);
router.delete(
  "/:routePricingId",
  [validateUUIDPathParam("routePricingId")],
  deleteRoutePricing
);
router.purge(
  "/:routePricingId",
  [validateUUIDPathParam("routePricingId")],
  purgeRoutePricing
);

export default router;
