import type { FastifyRequest } from "fastify";

export async function getReports(req: FastifyRequest) {
  return {
    message: "Reports for holders of the reports:read permission.",
    reports: [
      { id: "weekly-signups", title: "Weekly sign-ups" },
      { id: "active-sessions", title: "Active sessions" },
    ],
    user: req.user,
  };
}
