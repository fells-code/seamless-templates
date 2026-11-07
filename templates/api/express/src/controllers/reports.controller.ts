import { Request, Response } from "express";

export function getReports(req: Request, res: Response) {
  return res.json({
    message: "Reports for holders of the reports:read permission.",
    reports: [
      { id: "weekly-signups", title: "Weekly sign-ups" },
      { id: "active-sessions", title: "Active sessions" },
    ],
    user: req.user,
  });
}
