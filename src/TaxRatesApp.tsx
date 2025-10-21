import { useEffect, useMemo, useState } from "react";
import TrendCard from "./components/TrendCard";
import BracketTable from "./components/BracketTable";
import { fetchCalculation, fetchHistory, fetchAvailableYears } from "./api";
import {
  CURRENT_YEAR,
  DEFAULT_START,
  FILING_STATUSES,
  type FilingStatus,
  type HistoryPoint,
  type TaxCalculation,
  type TaxInput
} from "./types";


// TODO : Improve error handling and loading states with spinners/placeholders.
// TODO : Add routing for separate pages (trends vs calculator) with a button to switch between them in the header.



export default function TaxRatesApp() {
  const [trendStatus, setTrendStatus] = useState<FilingStatus>(FILING_STATUSES[0].value);
  const [startYear, setStartYear] = useState<number>(DEFAULT_START);
  const [endYear, setEndYear] = useState<number>(CURRENT_YEAR -1);
  const [calcStatus, setCalcStatus] = useState<FilingStatus>(FILING_STATUSES[0].value);
  const [calcYear, setCalcYear] = useState<number>(CURRENT_YEAR -1);
  const [income, setIncome] = useState<number>(85000);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [topRateSeries, setTopRateSeries] = useState<HistoryPoint[]>([]);
  const [bracketCountSeries, setBracketCountSeries] = useState<HistoryPoint[]>([]);
  const [calc, setCalc] = useState<TaxCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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

  const maxAvailableYear = availableYears.length ? availableYears[0] : calculatorYears[0];
  const minAvailableYear = availableYears.length
    ? availableYears.at(-1)!
    : calculatorYears.at(-1)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError("");
        setLoading(true);
        const years = await fetchAvailableYears();
        if (cancelled) return;
        if (!years.length) {
          console.warn("fetchAvailableYears returned an empty array.");
          return;
        }
        const sortedYears = years.slice().sort((a, b) => b - a);
        const maxYear = sortedYears[0];
        const minYear = sortedYears.at(-1)!;
        setAvailableYears(sortedYears);
        const clamp = (value: number) => Math.min(Math.max(value, minYear), maxYear);
        setEndYear((prev) => clamp(prev));
        setStartYear((prev) => clamp(prev));
        setCalcYear((prev) => clamp(prev));
      } catch (e) {
        console.error("Error fetching available years:", e);
        if (!cancelled) setError("Failed to fetch available years. Check API URL & CORS.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError("");
        setLoading(true);
        const [top, brackets] = await Promise.all([
          fetchHistory(trendStatus, "TOP_RATE", startYear, endYear),
          fetchHistory(trendStatus, "BRACKET_COUNT", startYear, endYear),
        ]);
        if (!cancelled) {
          setTopRateSeries(top);
          setBracketCountSeries(brackets);
          console.log("Trend data updated");
          console.log("Top Rate Series:", top);
          console.log("Bracket Count Series:", brackets);
        }
      } catch (e) {
        console.error("Error loading trends:", e);
        if (!cancelled) setError("Failed to load trends. Verify API URL & CORS.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trendStatus, startYear, endYear]);

  async function runCalc() {
    try {
      setError("");
      setLoading(true);
      console.log("Running calculation for:", { year: calcYear, status: calcStatus, income });
      const result = await fetchCalculation({ year: calcYear, status: calcStatus, income } as TaxInput);
      console.log("Calculation result:", result);
      setCalc(result);
    } catch (e) {
      console.error("Calculation error:", e);
      setError("Calculation failed. Check endpoint and query params.");
    } finally {
      setLoading(false);
    }
  }

  const controlClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60";

  const cardSurfaceClass =
    "rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-card backdrop-blur";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-brand-500/25 via-brand-300/20 to-transparent blur-3xl" />

        <header className="mb-10 flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-500/30">
            Federal Income Tax
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Marginal Tax Insights
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Explore historical trends and compute marginal &amp; effective rates across filing statuses and years.
            </p>
          </div>
        </header>

        <main className="space-y-10">
          <section className={`${cardSurfaceClass} space-y-4`}>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Trend Filters</h2>
              <p className="text-xs text-slate-500">Adjust the filing status and year range for the historical charts.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="trend-filing-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Filing Status
                </label>
                <select
                  id="trend-filing-status"
                  className={`${controlClass} appearance-none`}
                  value={trendStatus}
                  onChange={(e) => setTrendStatus(e.target.value as FilingStatus)}
                >
                  {FILING_STATUSES.map((fs) => (
                    <option key={fs.value} value={fs.value}>
                      {fs.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="start-year" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Year
                </label>
                <input
                  id="start-year"
                  type="number"
                  className={controlClass}
                  min={minAvailableYear}
                  max={maxAvailableYear}
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="end-year" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Year
                </label>
                <input
                  id="end-year"
                  type="number"
                  className={controlClass}
                  min={minAvailableYear}
                  max={maxAvailableYear}
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                />
              </div>
            </div>
          </section>

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
                  disabled={loading}
                >
                  {loading ? "Running…" : "Run Calculator"}
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
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

          <section className="grid gap-6 lg:grid-cols-2">
            <TrendCard
              title="Top Marginal Rate Over Time"
              data={topRateSeries}
              kind="line"
              yTickFormatter={(v) => `${v}%`}
              seriesName="Top Rate"
            />

            <TrendCard
              title="Number of Brackets Over Time"
              data={bracketCountSeries}
              kind="bar"
              seriesName="Bracket Count"
            />
          </section>

          
        </main>

        <footer className="mt-12 text-center text-xs text-slate-500">
          Built with React, TypeScript, Axios, Recharts &amp; Tailwind CSS.
        </footer>
      </div>
    </div>
  );
}
