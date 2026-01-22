import { getStore } from "../data/store.js";

type GetCompaniesFilters = {
  limit: number;
  offset: number;
  companyName?: string;
  employeeName?: string;
  active?: boolean;
};

export async function getCompanies(filters: GetCompaniesFilters) {
  const { companies, employeesByCompanyId } = getStore();
  let filtered = companies;

  if (filters.active !== undefined) {
    filtered = filtered.filter((company) => company.active === filters.active);
  }

  if (filters.companyName) {
    const query = filters.companyName.toLowerCase();
    filtered = filtered.filter((company) =>
      company.name.toLowerCase().includes(query),
    );
  }

  if (filters.employeeName) {
    const query = filters.employeeName.toLowerCase();
    filtered = filtered.filter((company) => {
      const CompanyEmployees = employeesByCompanyId.get(company.id) ?? [];
      return CompanyEmployees.some((employee) => {
        const full =
          `${employee.first_name} ${employee.last_name}`.toLowerCase();
        return (
          employee.first_name.toLowerCase().includes(query) ||
          employee.last_name.toLowerCase().includes(query) ||
          full.includes(query)
        );
      });
    });
  }

  const total = filtered.length;
  const limit = Number.isFinite(filters.limit)
    ? Math.max(1, Math.min(filters.limit, 100))
    : 20;
  const offset = Number.isFinite(filters.offset)
    ? Math.max(0, filters.offset)
    : 0;
  const page = filtered.slice(offset, offset + limit);
  const data = page.map((company) => ({
    ...company,
    employees: employeesByCompanyId.get(company.id) ?? [],
  }));

  return {
    data,
    metadata: {
      limit,
      offset,
      count: data.length,
      total,
    },
  };
}

export async function getCompaniesByIds(ids: number[]) {
  const { companiesById, employeesByCompanyId } = getStore();
  return ids
    .map((id) => {
      const company = companiesById.get(id);
      if (!company) return null;
      return {
        ...company,
        employees: employeesByCompanyId.get(id) ?? [],
      };
    })
    .filter(Boolean);
}
