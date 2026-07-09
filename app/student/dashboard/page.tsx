'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { formatDateVi } from '@/lib/format';
import { Plus, ClipboardList, Trophy, Clock3, ChevronRight } from 'lucide-react';

interface ExamHistory {
  id: string;
  examName: string;
  classroomName: string;
  submittedAt: string;
  score?: number;
  maxScore?: number;
  status: 'pending' | 'graded';
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/student/exam-history');
      if (res.ok) setHistory(await res.json());
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) return <PageLoading />;

  const graded = history.filter((h) => h.status === 'graded');
  // Điểm trung bình quy về thang 10.
  const avg =
    graded.length > 0
      ? graded.reduce(
          (s, h) => s + ((h.score || 0) / (h.maxScore || 1)) * 10,
          0
        ) / graded.length
      : null;
  // Quy điểm 1 bài về thang 10.
  const toScore10 = (score?: number, max?: number) =>
    Math.round(((score || 0) / (max || 1)) * 10 * 10) / 10;

  return (
    <div className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/student/join-exam">
              <Plus className="mr-1.5 h-4 w-4" /> Vào thi
            </Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Xin chào, {user?.fullName || 'bạn'} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">Bài thi và kết quả của bạn</p>
          </div>
          <Button asChild>
            <Link href="/student/join-exam">
              <Plus className="mr-1.5 h-4 w-4" /> Vào thi mới
            </Link>
          </Button>
        </div>

        {/* Thống kê */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            color="from-indigo-500 to-violet-600"
            label="Bài đã làm"
            value={String(history.length)}
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            color="from-amber-500 to-orange-500"
            label="Điểm trung bình"
            value={avg !== null ? `${avg.toFixed(1)}/10` : '—'}
          />
          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            color="from-sky-500 to-cyan-500"
            label="Chờ chấm"
            value={String(history.filter((h) => h.status === 'pending').length)}
          />
        </div>

        <h2 className="mb-4 text-lg font-bold">Lịch sử làm bài</h2>

        {loadingData ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-muted-foreground shadow-soft">
            Đang tải lịch sử...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">Chưa làm bài thi nào</h3>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
              Bấm &quot;Vào thi&quot; và nhập mã đề để bắt đầu bài thi đầu tiên.
            </p>
            <Button asChild>
              <Link href="/student/join-exam">Vào thi ngay</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((exam) => {
              const isGraded = exam.status === 'graded' && exam.score !== undefined;
              const diem = toScore10(exam.score, exam.maxScore);
              const pass = diem >= 5;
              return (
                <div
                  key={exam.id}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:shadow-soft-lg sm:p-5"
                >
                  {/* Vòng điểm */}
                  <div
                    className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${
                      !isGraded
                        ? 'border-amber-200 bg-amber-50 text-amber-600'
                        : pass
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : 'border-destructive/30 bg-destructive/5 text-destructive'
                    }`}
                  >
                    {isGraded ? (
                      <>
                        <span className="text-xl font-extrabold leading-none">
                          {diem}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          /10 điểm
                        </span>
                      </>
                    ) : (
                      <Clock3 className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold break-words">{exam.examName}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {exam.classroomName && <span>{exam.classroomName}</span>}
                      <span>Nộp lúc {formatDateVi(exam.submittedAt)}</span>
                    </div>
                    {!isGraded && (
                      <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Chờ chấm
                      </span>
                    )}
                  </div>

                  {isGraded && (
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link href={`/student/results/${exam.id}`}>
                        Xem chi tiết <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-soft`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}