// Enums are common in Java, here TS has union types:
export type FilingStatus =
  | "S"
  | "MFJ"
  | "MFS"
  | "HOH";

// Data point returned by /api/tax/history
export interface HistoryPoint {
  year: number;
  value: number;
}

// Tax bracket structure
export interface TaxBracket {
  year: number;
  status: FilingStatus;
  rangeStart: string;
  rangeEnd: string | null; 
  taxRate: string;
  taxPaid: string; 
}

// Response from /api/tax/breakdown
export interface TaxCalculation {
  totalTaxPaid: string;
  avgRate: string;
  message?: string;
  brackets: TaxBracket[];
}

// Input parameters for /api/tax/breakdown
export interface TaxInput {
  year: number;
  status: FilingStatus;
  income: number;
}

// Metric types for history API
export type HistoryMetric = "TOP_RATE" | "BRACKET_COUNT" | "AVERAGE_RATE" | "MIN_RATE";

// Filing status options for dropdowns, etc.
export const FILING_STATUSES: { label: string; value: FilingStatus }[] = [
  { label: "Single", value: "S" },
  { label: "Married Filing Jointly", value: "MFJ" },
  { label: "Married Filing Separately", value: "MFS" },
  { label: "Head of Household", value: "HOH" },
];

// Current year and default start year for history range
export const CURRENT_YEAR = new Date().getFullYear();
export const DEFAULT_START = 1924;

// Response from /api/v1/datasets/latest
export interface DatasetFreshness {
  latestAvailableTaxYear: number;
  irsPageLastUpdated: string;
  lastIngestedAt: string;
  freshnessState: string;
  sourceUrl: string;
}