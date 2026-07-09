'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { confirmDelete, toast } from '@/lib/swal';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { usePlan } from '@/lib/hooks/use-plan';
import { PLAN_LABELS } from '@/lib/plans';
import {
  Sparkles,
  FileText,
  Eye,
  FileDown,
  KeyRound,
  Trash2,
  School,
  Layers,
  BarChart3,
  Crown,
} from 'lucide-react';

interface ExamSet {
  id: string;
  name: string;
  setCode: string;
  subject: string;
  grade: number;
  questionCount: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { plan } = usePlan();
  const [exams, setExams] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/signin');
      return;
    }
    loadExams();
  }, [session, isPending]);

  const loadExams = async () => {
    try {
      const response = await fetch('/api/teacher/exam-bank');
      const data = await response.json();
      setExams(data.examSets || []);
    } catch (err) {
      console.error('Không tải được ngân hàng đề:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete({
      title: 'Xoá mã đề?',
      text: 'Mã đề cùng câu hỏi và đáp án sẽ bị xoá vĩnh viễn.',
    });
    if (!ok) return;
    try {
      await fetch(`/api/teacher/exam-bank/${id}`, { method: 'DELETE' });
      setExams((prev) => prev.filter((e) => e.id !== id));
      await toast('Đã xoá mã đề');
    } catch (err) {
      console.error('Không xoá được:', err);
    }
  };

  if (isPending) return <PageLoading />;

  const totalQuestions = exams.reduce((s, e) => s + (e.questionCount || 0), 0);
  const subjects = new Set(exams.map((e) => e.subject).filter(Boolean)).size;

  return (
    <main className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button
            variant={plan === 'free' ? 'default' : 'outline'}
            className="hidden sm:inline-flex"
            onClick={() => setUpgradeOpen(true)}
          >
            <Crown className="mr-1.5 h-4 w-4 text-amber-400" />
            {plan === 'free' ? 'Nâng cấp' : `Gói ${PLAN_LABELS[plan]}`}
          </Button>
        }
      />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Ngân hàng đề</h1>
            <p className="mt-1 text-muted-foreground">
              Các mã đề bạn đã tạo. Thêm chúng vào bài thi trong mục Lớp học.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/teacher/generate-exam">
                <Sparkles className="mr-1.5 h-4 w-4" /> AI Tạo đề
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/classrooms">
                <School className="mr-1.5 h-4 w-4" /> Lớp học
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/stats">
                <BarChart3 className="mr-1.5 h-4 w-4" /> Thống kê
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 sm:hidden"
              onClick={() => setUpgradeOpen(true)}
            >
              <Crown className="mr-1.5 h-4 w-4 text-amber-500" />
              {plan === 'free' ? 'Nâng cấp' : `Gói ${PLAN_LABELS[plan]}`}
            </Button>
          </div>
        </div>

        {/* Banner mời nâng cấp (chỉ hiện khi đang dùng gói miễn phí) */}
        {plan === 'free' && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="mb-8 flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-left text-white shadow-soft transition hover:shadow-soft-lg"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Crown className="h-6 w-6 text-amber-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">Mở khoá toàn bộ tính năng với gói PLUS</p>
              <p className="text-sm text-blue-100/90">
                Tạo đề bằng AI nhiều hơn, không giới hạn câu hỏi & chống gian lận nâng cao.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 sm:inline-block">
              Xem các gói
            </span>
          </button>
        )}

        {/* Thẻ thống kê */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            color="from-indigo-500 to-violet-600"
            label="Tổng mã đề"
            value={exams.length}
          />
          <StatCard
            icon={<Layers className="h-5 w-5" />}
            color="from-sky-500 to-cyan-500"
            label="Tổng số câu hỏi"
            value={totalQuestions}
          />
          <StatCard
            icon={<KeyRound className="h-5 w-5" />}
            color="from-emerald-500 to-teal-500"
            label="Số môn"
            value={subjects}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-muted-foreground shadow-soft">
            Đang tải ngân hàng đề...
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">Chưa có mã đề nào</h3>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
              Hãy để AI tạo đề thi đầu tiên cho bạn — đầy đủ đáp án và lời giải.
            </p>
            <Button asChild>
              <Link href="/teacher/generate-exam">
                <Sparkles className="mr-1.5 h-4 w-4" /> Tạo đề bằng AI
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:shadow-soft-lg"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold break-words sm:text-lg" title={exam.name}>
                      {exam.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
                        Mã đề {exam.setCode}
                      </span>
                      {exam.subject && <span>{exam.subject}</span>}
                      {exam.grade ? <span>Lớp {exam.grade}</span> : null}
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {exam.questionCount} câu
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:justify-end">
                    <Button asChild size="sm" variant="outline" className="w-full lg:w-auto">
                      <a
                        href={`/teacher/exam-preview/${exam.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> Xem / In
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full lg:w-auto">
                      <a href={`/api/teacher/exams/${exam.id}/export?type=exam`}>
                        <FileDown className="mr-1 h-3.5 w-3.5" /> Đề (Word)
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full lg:w-auto">
                      <a href={`/api/teacher/exams/${exam.id}/export?type=answer`}>
                        <KeyRound className="mr-1 h-3.5 w-3.5" /> Đáp án
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-destructive hover:bg-destructive/10 lg:w-auto"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Xoá
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
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
  value: number;
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
