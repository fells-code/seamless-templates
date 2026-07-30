import type { FastifyRequest } from "fastify";

export async function getBetaContent(req: FastifyRequest) {
  return {
    message: "Welcome to the beta program!",
    access: "You have beta_user privileges.",
    user: req.user,
  };
}
