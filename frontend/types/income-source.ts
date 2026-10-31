/**
 * Income sources based on docs/05-api/income-sources-api.md and docs/05-api/openapi.yaml.
 */

export interface IncomeSource {
  id: string;
  name: string;
  active: boolean;
}

export interface IncomeSourcesResponse {
  items: IncomeSource[];
}
