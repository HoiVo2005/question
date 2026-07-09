'use client';

// Vẽ BIỂU ĐỒ (chủ yếu cho môn Địa lí) từ dữ liệu do AI cung cấp, bằng recharts.
// chart = {
//   type: "bar" | "line" | "pie" | "area" | "combo",
//   title?: string,
//   unit?: string,                 // đơn vị trục tung
//   categories: string[],          // nhãn trục hoành (vd các năm)
//   series: [{ name, type?: "bar"|"line", data: number[] }]
// }
// Với "pie": dùng series đầu tiên, mỗi giá trị ứng với một category.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartSeries {
  name?: string;
  type?: 'bar' | 'line';
  data: number[];
}
export interface ChartData {
  type?: 'bar' | 'line' | 'pie' | 'area' | 'combo';
  title?: string;
  unit?: string;
  categories?: string[];
  series?: ChartSeries[];
}

// Bảng màu hợp đề in (đậm, rõ, khác biệt).
const COLORS = ['#1d4ed8', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

export function ChartView({ chart }: { chart?: ChartData | null }) {
  if (!chart || typeof chart !== 'object') return null;
  const categories = Array.isArray(chart.categories) ? chart.categories : [];
  const series = Array.isArray(chart.series) ? chart.series : [];
  if (!categories.length || !series.length) return null;

  const type = chart.type || 'bar';

  // Chuyển sang dạng recharts: [{ name: "2019", "Công nghiệp": 10, ... }]
  const data = categories.map((cat, i) => {
    const row: Record<string, string | number> = { name: String(cat) };
    series.forEach((s, si) => {
      const key = s.name || `Nhóm ${si + 1}`;
      row[key] = Number(s.data?.[i] ?? 0);
    });
    return row;
  });

  const keys = series.map((s, si) => s.name || `Nhóm ${si + 1}`);

  return (
    <figure className="my-3 w-full max-w-[440px]">
      {chart.title && (
        <figcaption className="mb-1 text-center text-sm font-semibold text-foreground">
          {chart.title}
        </figcaption>
      )}
      <div className="h-[260px] w-full rounded-lg border border-border bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(type, data, keys, series, chart.unit)}
        </ResponsiveContainer>
      </div>
      {chart.unit && (
        <figcaption className="mt-1 text-right text-xs italic text-muted-foreground">
          Đơn vị: {chart.unit}
        </figcaption>
      )}
    </figure>
  );
}

function renderChart(
  type: string,
  data: Record<string, string | number>[],
  keys: string[],
  series: ChartSeries[],
  unit?: string
) {
  const axis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} label={undefined} unit={unit ? '' : ''} />
      <Tooltip />
      <Legend wrapperStyle={{ fontSize: 11 }} />
    </>
  );

  if (type === 'pie') {
    const key = keys[0];
    const pieData = data.map((d) => ({ name: String(d.name), value: Number(d[key]) }));
    return (
      <PieChart>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          outerRadius={90}
          label={(e: any) => `${e.name}: ${e.value}`}
          labelLine={false}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  if (type === 'line') {
    return (
      <LineChart data={data}>
        {axis}
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    );
  }

  if (type === 'area') {
    return (
      <AreaChart data={data}>
        {axis}
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stackId="1"
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.35}
          />
        ))}
      </AreaChart>
    );
  }

  if (type === 'combo') {
    return (
      <ComposedChart data={data}>
        {axis}
        {keys.map((k, i) => {
          const seriesType = series[i]?.type;
          if (seriesType === 'line') {
            return (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            );
          }
          return (
            <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} barSize={22} />
          );
        })}
      </ComposedChart>
    );
  }

  // mặc định: bar
  return (
    <BarChart data={data}>
      {axis}
      {keys.map((k, i) => (
        <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} barSize={22} />
      ))}
    </BarChart>
  );
}
