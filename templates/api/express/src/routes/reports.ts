import { Router } from "express";
import { getReports } from "../controllers/reports.controller.js";

const router = Router();

router.get("/", getReports);

export default router;
