import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { HistoryPoint } from "../types";

interface TrendCardProps {
  title: string;
  data: HistoryPoint[];
  kind: "line" | "bar";
  yTickFormatter?: (v: number) => string;
  seriesName: string;
  heightClassName?: string;
  yearRangeLabel: string;
}

export default function TrendCard({
  title,
  data,
  kind,
  yTickFormatter,
  seriesName,
  heightClassName = "h-72",
  yearRangeLabel
}: Readonly<TrendCardProps>) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-card backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-xs uppercase tracking-wide text-slate-500">{yearRangeLabel}</p>
      </div>
      <div className={`${heightClassName} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === "line" ? (
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#475569" }}
                tickMargin={8}
                axisLine={{ stroke: "#cbd5f5" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#cbd5f5" }}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickFormatter={yTickFormatter}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#cbd5f5" }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(v: any) => {
                  let val: number | undefined;

                  if (typeof v === "number") {
                    val = v;
                  } else if (typeof v === "string" && !Number.isNaN(Number(v))) {
                    val = Number(v);
                  }

                  return [val !== undefined && yTickFormatter ? yTickFormatter(val) : String(v ?? ""), seriesName];
                }}
                labelFormatter={(l) => `Year ${l}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={seriesName}
                stroke="#4d63b4"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#475569" }}
                tickMargin={8}
                axisLine={{ stroke: "#cbd5f5" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={{ stroke: "#cbd5f5" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#cbd5f5" }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(v: any) => [String(v ?? ""), seriesName]}
                labelFormatter={(l) => `Year ${l}`}
              />
              <Legend />
              <Bar dataKey="value" name={seriesName} fill="#4d63b4" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
