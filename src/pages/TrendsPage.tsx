import { useEffect, useState } from "react";
import TrendCard from "../components/TrendCard";
import Spinner from "../components/Spinner";
import { fetchHistory } from "../api";
import {
  CURRENT_YEAR,
  DEFAULT_START,
  FILING_STATUSES,
  type FilingStatus,
  type HistoryPoint
} from "../types";
import { cardSurfaceClass, controlClass } from "../styles";

const FALLBACK_MIN_YEAR = 1862;
const FALLBACK_MAX_YEAR = CURRENT_YEAR - 1;

interface TrendsPageProps {
  availableYears: number[];
  yearsError: string;
}

export default function TrendsPage({ availableYears, yearsError }: Readonly<TrendsPageProps>) {
  const [trendStatus, setTrendStatus] = useState<FilingStatus>(FILING_STATUSES[0].value);
  const [startYear, setStartYear] = useState<number>(DEFAULT_START);
  const [endYear, setEndYear] = useState<number>(CURRENT_YEAR - 1);
  const [topRateSeries, setTopRateSeries] = useState<HistoryPoint[]>([]);
  const [bracketCountSeries, setBracketCountSeries] = useState<HistoryPoint[]>([]);
  const [trendsLoading, setTrendsLoading] = useState<boolean>(false);
  const [trendsError, setTrendsError] = useState<string>("");

  const maxAvailableYear = availableYears.length ? availableYears[0] : FALLBACK_MAX_YEAR;
  const minAvailableYear = availableYears.length ? availableYears.at(-1)! : FALLBACK_MIN_YEAR;

  useEffect(() => {
    if (!availableYears.length) return;
    const maxYear = availableYears[0];
    const minYear = availableYears.at(-1)!;
    const clamp = (value: number) => Math.min(Math.max(value, minYear), maxYear);
    setStartYear((prev) => clamp(prev));
    setEndYear((prev) => clamp(prev));
  }, [availableYears]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTrendsError("");
        setTrendsLoading(true);
        const [top, brackets] = await Promise.all([
          fetchHistory(trendStatus, "TOP_RATE", startYear, endYear),
          fetchHistory(trendStatus, "BRACKET_COUNT", startYear, endYear),
        ]);
        if (!cancelled) {
          setTopRateSeries(top);
          setBracketCountSeries(brackets);
        }
      } catch (e) {
        console.error("Error loading trends:", e);
        if (!cancelled) setTrendsError("Failed to load trends. Verify API URL & CORS.");
      } finally {
        if (!cancelled) setTrendsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trendStatus, startYear, endYear]);

  const showTrendSkeleton = trendsLoading && !topRateSeries.length && !bracketCountSeries.length;
  const trendErrors = [yearsError, trendsError].filter(Boolean);

  return (
    <>
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

      {trendErrors.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          <ul className="list-inside list-disc space-y-1">
            {trendErrors.map((msg, idx) => (
              <li key={`${msg}-${idx}`}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        {showTrendSkeleton ? (
          <>
            <div className={`${cardSurfaceClass} flex min-h-[18rem] items-center justify-center`}>
              <Spinner label="Loading top rate history..." />
            </div>
            <div className={`${cardSurfaceClass} flex min-h-[18rem] items-center justify-center`}>
              <Spinner label="Loading bracket history..." />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </section>
    </>
  );
}
