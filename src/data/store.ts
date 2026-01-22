import { promises as fs } from "node:fs";
import path from "node:path";

export type Company = {
  id: number;
  name: string;
  industry?: string;
  active?: boolean;
  website?: string;
  telephone?: string;
  slogan?: string;
  address?: string;
  city?: string;
  country?: string;
};

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  company_id: number;
};

export type Store = {
  companies: Company[];
  employees: Employee[];
  companiesById: Map<number, Company>;
  employeesByCompanyId: Map<number, Employee[]>;
};

function toNumber(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return undefined;
}

async function readAllJsonFiles(dir: string): Promise<any[]> {
  const output: any[] = [];
  let files: string[] = [];

  try {
    files = await fs.readdir(dir);
  } catch {
    return output;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const full = path.join(dir, file);
    try {
      const raw = await fs.readFile(full, "utf8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        output.push(...parsed);
        continue;
      }

      if (parsed && typeof parsed === "object") {
        if (parsed.company) output.push(parsed.company);
        else if (parsed.employee) output.push(parsed.employee);
        else if (parsed.data) output.push(parsed.data);
        else output.push(parsed);
      }
    } catch {
      console.warn(`[store] skipping invalid JSON: ${full}`);
    }
  }

  return output;
}

function normalizeCompaniesData(input: any): Company | null {
  const id = toNumber(input?.id);
  const name = typeof input?.name === "string" ? input.name : undefined;
  if (!id || !name) return null;

  return {
    id,
    name,
    industry: typeof input.industry === "string" ? input.industry : undefined,
    active: toBoolean(input.active),
    website: typeof input.website === "string" ? input.website : undefined,
    telephone: typeof input.telephone === "string" ? input.telephone : undefined,
    slogan: typeof input.slogan === "string" ? input.slogan : undefined,
    address: typeof input.address === "string" ? input.address : undefined,
    city: typeof input.city === "string" ? input.city : undefined,
    country: typeof input.country === "string" ? input.country : undefined,
  };
}

function normalizeEmployeesData(input: any): Employee | null {
  const id = toNumber(input?.id);
  const company_id = toNumber(input?.company_id);
  const first_name = typeof input?.first_name === "string" ? input.first_name : undefined;
  const last_name = typeof input?.last_name === "string" ? input.last_name : undefined;
  const role = typeof input?.role === "string" ? input.role : undefined;

  if (!id || !company_id || !first_name || !last_name || !role) return null;

  return {
    id,
    company_id,
    first_name,
    last_name,
    role,
    email: typeof input.email === "string" ? input.email : undefined,
  };
}

let store: Store | null = null;

export async function initStore(dataDir = path.resolve(process.cwd(), "data")) {
  const companiesDir = path.join(dataDir, "companies");
  const employeesDir = path.join(dataDir, "employees");

  const rawCompanies = await readAllJsonFiles(companiesDir);
  const rawEmployees = await readAllJsonFiles(employeesDir);

  const companies = rawCompanies.map(normalizeCompaniesData).filter(Boolean) as Company[];
  const employees = rawEmployees.map(normalizeEmployeesData).filter(Boolean) as Employee[];

  const companiesById = new Map<number, Company>();
  for (const company of companies) companiesById.set(company.id, company);

  const employeesByCompanyId = new Map<number, Employee[]>();
  for (const employee of employees) {
    const arr = employeesByCompanyId.get(employee.company_id) ?? [];
    arr.push(employee);
    employeesByCompanyId.set(employee.company_id, arr);
  }

  store = { companies, employees, companiesById, employeesByCompanyId };
  return store;
}

export function getStore(): Store {
  if (!store) throw new Error("Store not initialized. Call initStore() on startup.");
  return store;
}