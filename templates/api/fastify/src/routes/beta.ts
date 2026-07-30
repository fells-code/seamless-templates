import type { FastifyPluginAsync } from "fastify";
import { requireRole } from "@seamless-auth/fastify";

import { getBetaContent } from "../controllers/beta.controller.js";

const beta: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: requireRole("betaUser") }, getBetaContent);
};

export default beta;
