import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "@seamless-auth/fastify";

import { getReports } from "../controllers/reports.controller.js";

// reports:read is the example permission in every Seamless starter, so one role
// mapped to it in the admin console opens this route in whichever starter you
// scaffolded. Permissions need auth API v0.23 or later: an older API issues no
// permissions claim, and this route answers 403 to everyone until then.
const reports: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: requirePermission("reports:read") }, getReports);
};

export default reports;
