import { Request, Response } from "express";

export function getBetaContent(req: Request, res: Response) {
  return res.json({
    message: "Welcome to the beta program!",
    access: "You have beta_user privileges.",
    user: req.user,
  });
}
