import type { Request, Response, NextFunction } from "express";
import { allCompanies, companiesByIds } from "../companies.js";
import { getCompanies, getCompaniesByIds } from "../../services/companies.js";

jest.mock("../../services/companies.js", () => ({
  getCompanies: jest.fn(),
  getCompaniesByIds: jest.fn(),
}));

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

function makeResponse(): MockResponse {
  const response = {} as MockResponse;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
}

function makeNextFunction(): NextFunction {
  return jest.fn();
}

describe("companies controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("allCompanies", () => {
    it("returns 200 with result and passes default query params", async () => {
      const request = {
        query: {},
      } as unknown as Request;

      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const result = { data: [], meta: { total: 0 } };
      (getCompanies as jest.Mock).mockResolvedValue(result);

      await allCompanies(request, response, nextFunction);

      expect(getCompanies).toHaveBeenCalledWith({
        limit: 200,
        offset: 0,
        companyName: undefined,
        employeeName: undefined,
        active: undefined,
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("maps query params correctly", async () => {
      const request = {
        query: {
          limit: "10",
          offset: "5",
          companyName: "pethericks",
          employeeName: "Jane",
          active: "true",
        },
      } as unknown as Request;

      const response = makeResponse();
      const nextFunction = makeNextFunction();

      (getCompanies as jest.Mock).mockResolvedValue({ data: [] });

      await allCompanies(request, response, nextFunction);

      expect(getCompanies).toHaveBeenCalledWith({
        limit: 10,
        offset: 5,
        companyName: "pethericks",
        employeeName: "Jane",
        active: true,
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("calls nextFunction(error) if service throws", async () => {
      const request = { query: {} } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const error = new Error("error");
      (getCompanies as jest.Mock).mockRejectedValue(error);

      await allCompanies(request, response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe("companiesByIds", () => {
    it("400 when id param is empty", async () => {
      const request = { params: { id: "" } } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      await companiesByIds(request, response, nextFunction);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: { code: "BAD_REQUEST", message: "Invalid company id(s." },
      });
      expect(getCompaniesByIds).not.toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("400 when any id is invalid (negative / non-integer / NaN)", async () => {
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const requestWithNegativeId = {
        params: { id: "-1" },
      } as unknown as Request;

      await companiesByIds(requestWithNegativeId, response, nextFunction);
      expect(response.status).toHaveBeenLastCalledWith(400);

      const requestWithDecimalId = {
        params: { id: "1,2.5" },
      } as unknown as Request;

      await companiesByIds(requestWithDecimalId, response, nextFunction);
      expect(response.status).toHaveBeenLastCalledWith(400);

      const requestWithNonNumericId = {
        params: { id: "abc" },
      } as unknown as Request;

      await companiesByIds(requestWithNonNumericId, response, nextFunction);
      expect(response.status).toHaveBeenLastCalledWith(400);

      expect(getCompaniesByIds).not.toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("400 when more than 50 ids", async () => {
      const ids = Array.from({ length: 51 }, (_, index) => index + 1).join(",");
      const request = { params: { id: ids } } as unknown as Request;

      const response = makeResponse();
      const nextFunction = makeNextFunction();

      await companiesByIds(request, response, nextFunction);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: { code: "BAD_REQUEST", message: "Too many ids (max 50)." },
      });
      expect(getCompaniesByIds).not.toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("404 for single id when not found", async () => {
      const request = { params: { id: "123" } } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      (getCompaniesByIds as jest.Mock).mockResolvedValue([]);

      await companiesByIds(request, response, nextFunction);

      expect(getCompaniesByIds).toHaveBeenCalledWith([123]);
      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        error: { code: "NOT_FOUND", message: "Company not found." },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("returns { data: company } for single id when found", async () => {
      const request = { params: { id: "7" } } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const company = { id: 7, companyName: "pethericks" };
      (getCompaniesByIds as jest.Mock).mockResolvedValue([company]);

      await companiesByIds(request, response, nextFunction);

      expect(getCompaniesByIds).toHaveBeenCalledWith([7]);
      expect(response.json).toHaveBeenCalledWith({ data: company });
      expect(response.status).not.toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("returns array result for multiple ids (handles whitespace)", async () => {
      const request = { params: { id: "1, 2 ,3" } } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const result = [{ id: 1 }, { id: 2 }, { id: 3 }];
      (getCompaniesByIds as jest.Mock).mockResolvedValue(result);

      await companiesByIds(request, response, nextFunction);

      expect(getCompaniesByIds).toHaveBeenCalledWith([1, 2, 3]);
      expect(response.json).toHaveBeenCalledWith(result);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("calls nextFunction(error) if service throws", async () => {
      const request = { params: { id: "1,2" } } as unknown as Request;
      const response = makeResponse();
      const nextFunction = makeNextFunction();

      const error = new Error("error");
      (getCompaniesByIds as jest.Mock).mockRejectedValue(error);

      await companiesByIds(request, response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});
