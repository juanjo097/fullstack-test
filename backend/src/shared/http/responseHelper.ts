import type { Response } from "express";

export const ok = <T>(res: Response, data?: T) => {
  if (data === undefined) return res.status(200).send();
  return res.status(200).json({ data });
};

export const created = <T>(res: Response, data?: T) => {
  if (data === undefined) return res.status(201).send();
  return res.status(201).json({ data });
};

export const noContent = (res: Response) => res.status(204).send();

export const paginated = <T>(
  res: Response,
  data: T,
  meta: Record<string, unknown>,
) => res.status(200).json({ data, meta });
