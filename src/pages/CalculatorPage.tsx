import { useEffect, useMemo, useState } from "react";
import BracketTable from "../components/BracketTable";
import Spinner from "../components/Spinner";
import { fetchCalculation } from "../api";
import {
  CURRENT_YEAR,
  FILING_STATUSES,
  type FilingStatus,
  type TaxCalculation,
  type TaxInput
} from "../types";
import { cardSurfaceClass, controlClass } from "../styles";

interface CalculatorPageProps {
  availableYears: number[];
  yearsError: string;
}

export default function CalculatorPage({ availableYears, yearsError }: Readonly<CalculatorPageProps>) {
  const [calcStatus, setCalcStatus] = useState<FilingStatus>(FILING_STATUSES[0].value);
  const [calcYear, setCalcYear] = useState<number>(CURRENT_YEAR - 1);
  const [income, setIncome] = useState<number>(85000);
  const [calc, setCalc] = useState<TaxCalculation | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string>("");

  const fallbackCalculatorYears: number[] = useMemo(() => {
    const lastYear = CURRENT_YEAR - 1;
    const firstYear = 1862;
    const length = lastYear - firstYear + 1;
    return Array.from({ length }, (_, i) => lastYear - i);
  }, []);

  const calculatorYears: number[] = useMemo(() => {
    if (availableYears.length) {
      return availableYears;
    }
    return fallbackCalculatorYears;
  }, [availableYears, fallbackCalculatorYears]);

  useEffect(() => {
    if (!availableYears.length) return;
    const maxYear = availableYears[0];
    const minYear = availableYears.at(-1)!;
    const clamp = (value: number) => Math.min(Math.max(value, minYear), maxYear);
    setCalcYear((prev) => clamp(prev));
  }, [availableYears]);

  async function runCalc() {
    try {
      setCalcError("");
      setCalcLoading(true);
      console.log("Running calculation for:", { year: calcYear, status: calcStatus, income });
      const result = await fetchCalculation({ year: calcYear, status: calcStatus, income } as TaxInput);
      console.log("Calculation result:", result);
      setCalc(result);
    } catch (e) {
      console.error("Calculation error:", e);
      setCalcError("Calculation failed. Check endpoint and query params.");
    } finally {
      setCalcLoading(false);
    }
  }

  const showCalcSkeleton = calcLoading && !calc;
  const calculatorErrors = [yearsError, calcError].filter(Boolean);

  return (
    <>
      <section className={`${cardSurfaceClass} space-y-4`}>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Marginal Calculator</h2>
          <p className="text-xs text-slate-500">Choose separate inputs to run the marginal tax calculation.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="calculator-filing-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filing Status
            </label>
            <select
              id="calculator-filing-status"
              className={`${controlClass} appearance-none`}
              value={calcStatus}
              onChange={(e) => setCalcStatus(e.target.value as FilingStatus)}
            >
              {FILING_STATUSES.map((fs) => (
                <option key={fs.value} value={fs.value}>
                  {fs.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="year-calculator" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tax Year
            </label>
            <select
              id="year-calculator"
              className={`${controlClass} appearance-none`}
              value={calcYear}
              onChange={(e) => setCalcYear(Number(e.target.value))}
            >
              {calculatorYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
            <label htmlFor="income" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Income ($)
            </label>
            <input
              id="income"
              type="number"
              className={controlClass}
              min={0}
              step={100}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
            />
          </div>

          <div className="flex items-end md:col-span-2 lg:col-span-1">
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:bg-brand-300"
              onClick={runCalc}
              disabled={calcLoading}
            >
              {calcLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Calculating…
                </span>
              ) : (
                "Run Calculator"
              )}
            </button>
          </div>
        </div>
      </section>

      {calculatorErrors.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          <ul className="list-inside list-disc space-y-1">
            {calculatorErrors.map((msg, idx) => (
              <li key={`${msg}-${idx}`}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {showCalcSkeleton && (
        <section className={`${cardSurfaceClass} flex items-center justify-center`}>
          <Spinner label="Preparing calculation..." />
        </section>
      )}

      {calc && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className={`${cardSurfaceClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              <p className="mt-1 text-sm text-slate-500">
                Based on {income.toLocaleString()} in {calcYear} for{" "}
                {FILING_STATUSES.find((fs) => fs.value === calcStatus)?.label ?? calcStatus}.
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                <span className="font-medium">Total Tax Paid</span>
                <span className="font-semibold text-slate-900">{calc.totalTaxPaid}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                <span className="font-medium">Effective Rate</span>
                <span className="font-semibold text-slate-900">{calc.avgRate}</span>
              </li>
            </ul>
            {calc.message && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {calc.message}
              </div>
            )}
            <div className="space-y-2 text-xs text-slate-500">
              <h3 className="font-semibold uppercase tracking-wide text-slate-600">How To Read Brackets</h3>
              <p>Rates are marginal. Tax paid represents amount due in each bracket, not cumulative totals.</p>
              <p>Example: 10% on the first $11k, 12% on the next $33k, and so on.</p>
            </div>
          </div>

          <BracketTable brackets={calc.brackets} />
        </section>
      )}
    </>
  );
}
