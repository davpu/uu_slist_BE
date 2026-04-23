import type { Request, Response } from "express";

export interface SuccessEnvelope<Data> {
  dtoIn: unknown;
  data: Data;
}

/**
 * Standard success response. Always echoes the received dtoIn.
 */
export function ok<Data>(res: Response, req: Request, data: Data, status = 200): Response<SuccessEnvelope<Data>> {
  return res.status(status).json({
    dtoIn: req.dtoIn ?? req.body ?? {},
    data,
  });
}
