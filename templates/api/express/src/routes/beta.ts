import { Router } from "express";
import { getBetaContent } from "../controllers/beta.controller.js";

const router = Router();

router.get("/", getBetaContent);

export default router;
