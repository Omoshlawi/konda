import { getCounties, getSubcounties, getWards } from "@/controllers/locations";
import { Router } from "express";

const router = Router();
router.get("/counties", getCounties);
router.get("/subcounties", getSubcounties);
router.get("/wards", getWards);
export default router;
