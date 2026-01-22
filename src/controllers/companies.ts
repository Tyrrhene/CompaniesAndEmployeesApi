import type { Request, Response, NextFunction } from "express";
import { getCompanies, getCompaniesByIds } from "../services/companies.js";

export const allCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      limit = "200",
      offset = "0",
      companyName,
      active,
      employeeName,
    } = req.query;

    const result = await getCompanies({
      limit: Number(limit),
      offset: Number(offset),
      companyName: companyName?.toString(),
      employeeName: employeeName?.toString(),
      active: active !== undefined ? active === "true" : undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export async function companiesByIds(req: Request, res: Response, next: NextFunction) {
  try {
   const raw = req.params.id;

   const idString = Array.isArray(raw) ? raw.join(",") : raw;

   const ids = idString
   .split(",")
   .map((string: string) => string.trim())
   .filter((string: string) => string.length > 0)
   .map((string: string) => Number(string));

    if (ids.length === 0 || ids.some((n) => !Number.isInteger(n) || n < 0)) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid company id(s." },
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Too many ids (max 50)." },
      });
    }

    const result = await getCompaniesByIds(ids);
    if (ids.length === 1) {
      if (!result[0]) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Company not found." },
        });
      }
      return res.json({ data: result[0] });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}