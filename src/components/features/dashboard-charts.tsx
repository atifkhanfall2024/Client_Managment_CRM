"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#24548c", "#3a6ea5", "#6b93c4", "#94a8c0", "#1a3d68"];

type Slice = { name: string; value: number; key?: string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; payload?: Slice }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-muted">
          {p.payload?.name ?? p.name}:{" "}
          <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function StatusPieChart({
  data,
  title,
}: {
  data: Slice[];
  title: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data.filter((d) => d.value > 0);

  return (
    <div className="animate-fade-up h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <span className="text-xs text-muted">{total} total</span>
      </div>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No data yet</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                animationBegin={0}
                animationDuration={900}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((d, i) => (
          <span
            key={d.key ?? d.name}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft/50 px-2.5 py-1 text-xs text-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {d.name} · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatusBarChart({
  data,
  title,
}: {
  data: Slice[];
  title: string;
}) {
  return (
    <div className="animate-fade-up h-full">
      <h3 className="mb-4 text-base font-bold text-foreground">{title}</h3>
      {data.every((d) => d.value === 0) ? (
        <p className="py-16 text-center text-sm text-muted">No data yet</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--brand-soft)", opacity: 0.35 }} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                animationDuration={900}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function PipelineAreaChart({
  data,
  title,
}: {
  data: Slice[];
  title: string;
}) {
  return (
    <div className="animate-fade-up h-full">
      <h3 className="mb-4 text-base font-bold text-foreground">{title}</h3>
      {data.every((d) => d.value === 0) ? (
        <p className="py-16 text-center text-sm text-muted">No data yet</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="pipelineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#24548c" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#24548c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#24548c"
                strokeWidth={2.5}
                fill="url(#pipelineFill)"
                animationDuration={1100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
