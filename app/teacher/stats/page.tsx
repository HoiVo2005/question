'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import {
  ArrowLeft,
  School,
  Users,
  FileText,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ClassStat {
  id: string;
  name: string;
  studentCount: number;
  examCount: number;
  submissionCount: number;
  avg: number;
}
interface ExamStat {
  id: string;
  name: string;
  className: string;
  submissionCount: number;
  gradedCount: number;
  avg: number;
  passRate: number;
  bands: { gioi: number; kha: number; tb: number; yeu: number };
}
interface Stats {
  totals: {
    classes: number;
    students: number;
    exams: number;
    submissions: number;
    graded: number;
  };
  byClass: ClassStat[];
  byExam: ExamStat[];
  overallBands: { gioi: number; kha: number; tb: number; yeu: number };
}

const BAND_COLORS = {
  gioi: '#10b981',
  kha: '#0ea5e9',
  tb: '#f59e0b',
  yeu: '#ef4444',
};
const BAND_LABELS = {
  gioi: 'Giỏi (≥8)',
  kha: 'Khá (6.5–8)',
  tb: 'Trung bình (5–6.5)',
  yeu: 'Yếu (<5)',
};

interface RankRow {
  name: string;
  score: number | null;
  status: string;
}
interface RankRoom {
  id: string;
  name: string;
  rows: RankRow[];
}
interface RankClass {
  id: string;
  name: string;
  rooms: RankRoom[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ranking, setRanking] = useState<RankClass[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch('/api/teacher/stats'),
          fetch('/api/teacher/stats/ranking'),
        ]);
        if (sRes.ok) setStats(await sRes.json());
        if (rRes.ok) {
          const data = await rRes.json();
          setRanking(data.classes || []);
          if (data.classes?.length) setActiveTab(data.classes[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoading />;
  if (!stats)
    return (
      <div className="app-bg min-h-screen">
        <AppHeader />
        <p className="p-12 text-center text-muted-foreground">Không tải được thống kê.</p>
      </div>
    );

  const classChartData = stats.byClass.map((c) => ({
    name: c.name,
    'Điểm TB': c.avg,
  }));
  const pieData = (['gioi', 'kha', 'tb', 'yeu'] as const)
    .map((k) => ({
      key: k,
      name: BAND_LABELS[k],
      value: stats.overallBands[k],
    }))
    .filter((d) => d.value > 0);

  const hasData = stats.totals.submissions > 0;

  return (
    <main className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/dashboard">
              <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Bảng điều khiển</span>
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thống kê</h1>
            <p className="text-sm text-muted-foreground">
              Kết quả theo lớp và theo từng bài thi
            </p>
          </div>
        </div>

        {/* Thẻ tổng quan */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={<School className="h-5 w-5" />} color="from-indigo-500 to-violet-600" label="Lớp" value={stats.totals.classes} />
          <Stat icon={<Users className="h-5 w-5" />} color="from-sky-500 to-cyan-500" label="Học sinh" value={stats.totals.students} />
          <Stat icon={<FileText className="h-5 w-5" />} color="from-fuchsia-500 to-pink-500" label="Bài thi" value={stats.totals.exams} />
          <Stat icon={<ClipboardCheck className="h-5 w-5" />} color="from-emerald-500 to-teal-500" label="Lượt nộp" value={stats.totals.submissions} />
        </div>

        {!hasData ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-soft">
            Chưa có dữ liệu bài làm để thống kê. Khi học sinh nộp bài, biểu đồ sẽ hiển thị.
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Điểm TB theo lớp */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <h2 className="mb-4 font-bold">Điểm trung bình theo lớp</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classChartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="Điểm TB" radius={[6, 6, 0, 0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Phân loại học lực */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <h2 className="mb-4 font-bold">Phân loại học lực</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(e: any) => `${e.value}`}
                      >
                        {pieData.map((d) => (
                          <Cell key={d.key} fill={BAND_COLORS[d.key as keyof typeof BAND_COLORS]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Theo bài thi */}
            <h2 className="mb-4 text-lg font-bold">Thống kê theo bài thi</h2>
            <div className="grid gap-3">
              {stats.byExam.map((ex) => {
                const totalBand =
                  ex.bands.gioi + ex.bands.kha + ex.bands.tb + ex.bands.yeu || 1;
                return (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{ex.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {ex.className} · {ex.submissionCount} lượt nộp · {ex.gradedCount} đã
                          chấm
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          Điểm TB:{' '}
                          <b className="text-primary">{ex.avg}</b>
                          <span className="text-muted-foreground">/10</span>
                        </span>
                        <span>
                          Đạt:{' '}
                          <b
                            className={
                              ex.passRate >= 50 ? 'text-emerald-600' : 'text-destructive'
                            }
                          >
                            {ex.passRate}%
                          </b>
                        </span>
                      </div>
                    </div>

                    {/* Thanh phân loại */}
                    {ex.gradedCount > 0 && (
                      <div className="mt-3">
                        <div className="flex h-3 w-full overflow-hidden rounded-full">
                          {(['gioi', 'kha', 'tb', 'yeu'] as const).map((k) =>
                            ex.bands[k] > 0 ? (
                              <div
                                key={k}
                                style={{
                                  width: `${(ex.bands[k] / totalBand) * 100}%`,
                                  background: BAND_COLORS[k],
                                }}
                                title={`${BAND_LABELS[k]}: ${ex.bands[k]}`}
                              />
                            ) : null
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {(['gioi', 'kha', 'tb', 'yeu'] as const).map((k) => (
                            <span key={k} className="inline-flex items-center gap-1">
                              <span
                                className="h-2.5 w-2.5 rounded"
                                style={{ background: BAND_COLORS[k] }}
                              />
                              {BAND_LABELS[k]}: {ex.bands[k]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bảng điểm theo lớp (tab) */}
        {ranking.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Bảng điểm theo lớp</h2>

            {/* Tabs lớp */}
            <div className="mb-5 flex flex-wrap gap-2">
              {ranking.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    activeTab === c.id
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {(() => {
              const cls = ranking.find((c) => c.id === activeTab);
              if (!cls) return null;
              if (cls.rooms.length === 0)
                return (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-soft">
                    Lớp này chưa có bài kiểm tra nào.
                  </div>
                );
              return (
                <div className="space-y-5">
                  {cls.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3">
                        <h3 className="font-semibold">{room.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {room.rows.length} học sinh
                        </span>
                      </div>
                      {room.rows.length === 0 ? (
                        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                          Chưa có học sinh nộp bài.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                              <th className="w-14 px-5 py-2 text-center">STT</th>
                              <th className="px-2 py-2">Tên học sinh</th>
                              <th className="w-24 px-5 py-2 text-right">Điểm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {room.rows.map((r, i) => (
                              <tr
                                key={i}
                                className="border-b border-border/40 last:border-0"
                              >
                                <td className="px-5 py-2.5 text-center">
                                  <span
                                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                      i === 0 && r.score != null
                                        ? 'bg-amber-100 text-amber-700'
                                        : i === 1 && r.score != null
                                          ? 'bg-slate-200 text-slate-700'
                                          : i === 2 && r.score != null
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'text-muted-foreground'
                                    }`}
                                  >
                                    {i + 1}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 font-medium">{r.name}</td>
                                <td className="px-5 py-2.5 text-right">
                                  {r.score != null ? (
                                    <span
                                      className={`font-bold ${
                                        r.score >= 5
                                          ? 'text-emerald-600'
                                          : 'text-destructive'
                                      }`}
                                    >
                                      {r.score}
                                      <span className="text-xs font-normal text-muted-foreground">
                                        /10
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                      Chờ chấm
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-soft`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
