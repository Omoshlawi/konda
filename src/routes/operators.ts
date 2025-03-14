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

const router = Router({ mergeParams: true });

router.get("/", getOperators);
router.post("/", addOperator);
router.get("/:operatorId", [validateUUIDPathParam("operatorId")], getOperator);
router.patch(
  "/:operatorId",
  [validateUUIDPathParam("operatorId")],
  patchOperator
);
router.put(
  "/:operatorId",
  [validateUUIDPathParam("operatorId")],
  updateOperator
);
router.delete(
  "/:operatorId",
  [validateUUIDPathParam("operatorId")],
  deleteOperator
);
router.purge(
  "/:operatorId",
  [validateUUIDPathParam("operatorId")],
  purgeOperator
);

export default router;
