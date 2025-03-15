import { Router } from "express";
import {
  addOperator,
  deleteOperator,
  getOperator,
  getOperators,
  patchOperator,
  purgeOperator,
  updateOperator,
} from "../controllers/operators";
import { validateUUIDPathParam } from "@/middlewares";
import authenticate from "@/middlewares/authentication";

const router = Router({ mergeParams: true });

router.get("/", getOperators);
router.post("/", [authenticate], addOperator);
router.get("/:operatorId", [validateUUIDPathParam("operatorId")], getOperator);
router.patch(
  "/:operatorId",
  [validateUUIDPathParam("operatorId"), authenticate],
  patchOperator
);
router.put(
  "/:operatorId",
  [validateUUIDPathParam("operatorId"), authenticate],
  updateOperator
);
router.delete(
  "/:operatorId",
  [validateUUIDPathParam("operatorId"), authenticate],
  deleteOperator
);
router.purge(
  "/:operatorId",
  [validateUUIDPathParam("operatorId"), authenticate],
  purgeOperator
);

export default router;
