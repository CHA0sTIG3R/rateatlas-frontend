import { useEffect, useState } from "react";
import TrendsPage from "./pages/TrendsPage";
import CalculatorPage from "./pages/CalculatorPage";
import Spinner from "./components/Spinner";
import { fetchAvailableYears } from "./api";
import { cardSurfaceClass } from "./styles";

type AppPage = "trends" | "calculator";

const DEFAULT_PAGE: AppPage = "trends";

const getPageFromHash = (): AppPage => {
  if (typeof window === "undefined") {
    return DEFAULT_PAGE;
  }
  const normalizedHash = window.location.hash.replace("#", "").toLowerCase();
  return normalizedHash === "calculator" ? "calculator" : DEFAULT_PAGE;
};

const syncHashToPage = (page: AppPage) => {
  if (typeof window === "undefined") {
    return;
  }
  const targetHash = `#${page}`;
  if (window.location.hash !== targetHash) {
    window.history.replaceState(null, "", targetHash);
  }
};

export default function TaxRatesApp() {
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState<boolean>(true);
  const [yearsError, setYearsError] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    syncHashToPage(activePage);
  }, [activePage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setYearsError("");
        setYearsLoading(true);
        const years = await fetchAvailableYears();
        if (cancelled) return;
        if (!years.length) {
          console.warn("fetchAvailableYears returned an empty array.");
          return;
        }
        const sortedYears = years.slice().sort((a, b) => b - a);
        setAvailableYears(sortedYears);
      } catch (e) {
        console.error("Error fetching available years:", e);
        if (!cancelled) setYearsError("Failed to fetch available years. Check API URL & CORS.");
      } finally {
        if (!cancelled) setYearsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePage = () => {
    setActivePage((prev) => (prev === "trends" ? "calculator" : "trends"));
  };

  const isBootstrappingYears = yearsLoading && !availableYears.length;
  const isTrendsPage = activePage === "trends";
  const isCalculatorPage = activePage === "calculator";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-brand-500/25 via-brand-300/20 to-transparent blur-3xl" />

        <header className="mb-10 flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-500/30">
            Federal Income Tax
          </span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Marginal Tax Insights
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Explore historical trends and compute marginal &amp; effective rates across filing statuses and years.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-brand-700 shadow-card transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              onClick={togglePage}
            >
              {isTrendsPage ? "Open Calculator" : "View Trends"}
            </button>
          </div>
        </header>

        <main className="space-y-10">
          {isBootstrappingYears && (
            <section className={`${cardSurfaceClass} flex items-center justify-center`}>
              <Spinner label="Fetching available tax years..." />
            </section>
          )}

          {isTrendsPage && <TrendsPage availableYears={availableYears} yearsError={yearsError} />}
          {isCalculatorPage && <CalculatorPage availableYears={availableYears} yearsError={yearsError} />}
        </main>

        <footer className="mt-12 text-center text-xs text-slate-500">
          Built with React, TypeScript, Axios, Recharts &amp; Tailwind CSS.
        </footer>
      </div>
    </div>
  );
}
