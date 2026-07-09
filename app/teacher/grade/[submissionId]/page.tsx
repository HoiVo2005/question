'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { MathText } from '@/components/math-text';
import { FigureView } from '@/components/figure-view';
import { ChartView } from '@/components/chart-view';
import { toast, notify } from '@/lib/swal';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  ImageIcon,
  ClipboardCheck,
} from 'lucide-react';

interface Q {
  id: string;
  questionNumber: number;
  content: string;
  type: 'mcq' | 'essay';
  figure?: any | null;
  chart?: any | null;
  points: number;
  correctAnswer: string | null;
  explanation: string | null;
  selectedOption: string | null;
  isCorrect: boolean | null;
  earnedPoints: number | null;
  essayImageUrl: string | null;
  essayText: string | null;
}
interface Detail {
  id: string;
  studentName: string;
  email: string;
  examTitle: string;
  roomName: string;
  status: string;
  totalScore: number | null;
  maxScore: number | null;
  mcqCorrect: number;
  mcqTotal: number;
  questions: Q[];
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [essayScores, setEssayScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (submissionId) load();
  }, [submissionId]);

  const load = async () => {
    try {
      const res = await fetch(`/api/teacher/submissions/${submissionId}`);
      const data = await res.json();
      if (res.ok) {
        setDetail(data);
        const init: Record<string, string> = {};
        for (const q of data.questions as Q[]) {
          if (q.type === 'essay')
            init[q.id] = q.earnedPoints != null ? String(q.earnedPoints) : '';
        }
        setEssayScores(init);
      }
    } finally {
      setLoading(false);
    }
  };

  const mcqScore = useMemo(() => {
    if (!detail) return 0;
    return detail.questions
      .filter((q) => q.type === 'mcq')
      .reduce((s, q) => s + (q.earnedPoints || 0), 0);
  }, [detail]);

  const essaySum = useMemo(
    () =>
      Object.values(essayScores).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [essayScores]
  );

  const liveTotal = Math.round((mcqScore + essaySum) * 100) / 100;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayScores: Object.fromEntries(
            Object.entries(essayScores).map(([k, v]) => [k, parseFloat(v) || 0])
          ),
        }),
      });
      if (!res.ok) throw new Error('Lưu điểm thất bại');
      await toast('Đã lưu điểm');
      router.back();
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!detail)
    return (
      <div className="app-bg min-h-screen">
        <AppHeader />
        <p className="p-12 text-center text-muted-foreground">Không tìm thấy bài nộp.</p>
      </div>
    );

  const essays = detail.questions.filter((q) => q.type === 'essay');
  const mcqs = detail.questions.filter((q) => q.type === 'mcq');

  return (
    <main className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Quay lại</span>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Tóm tắt */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">{detail.studentName}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {detail.examTitle} · {detail.roomName}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">
                {detail.mcqCorrect}/{detail.mcqTotal}
              </p>
              <p className="text-xs text-muted-foreground">Câu đúng (TN)</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">{Math.round(mcqScore * 100) / 100}</p>
              <p className="text-xs text-muted-foreground">Điểm trắc nghiệm</p>
            </div>
            <div className="col-span-2 rounded-xl bg-primary/10 p-3 text-center sm:col-span-1">
              <p className="text-lg font-bold text-primary">
                {liveTotal}/{detail.maxScore ?? 10}
              </p>
              <p className="text-xs text-muted-foreground">Tổng điểm</p>
            </div>
          </div>
        </div>

        {/* Tự luận: chấm */}
        {essays.length > 0 ? (
          <div className="mb-6 space-y-4">
            <h2 className="text-lg font-bold">Chấm tự luận ({essays.length} câu)</h2>
            {essays.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
              >
                <p className="font-semibold">
                  Câu {q.questionNumber}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    (tối đa {q.points} điểm)
                  </span>
                </p>
                <p className="mt-1 text-sm text-foreground/90">
                  <MathText text={q.content} />
                </p>
                <FigureView figure={q.figure} />
                <ChartView chart={q.chart} />

                {/* Bài làm của học sinh */}
                <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" /> Bài làm của học sinh
                  </p>
                  {q.essayImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.essayImageUrl}
                      alt="Bài làm"
                      className="h-auto max-h-96 max-w-full rounded-lg border"
                    />
                  ) : q.essayText ? (
                    <p className="whitespace-pre-wrap text-sm">{q.essayText}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Học sinh chưa nộp bài làm cho câu này.
                    </p>
                  )}
                </div>

                {/* Đáp án mẫu */}
                {q.explanation && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-medium text-primary">
                      Xem đáp án mẫu / hướng dẫn chấm
                    </summary>
                    <div className="mt-1 rounded-lg bg-primary/5 p-3 text-foreground/80">
                      <MathText text={q.explanation} />
                    </div>
                  </details>
                )}

                {/* Nhập điểm */}
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm font-medium">Điểm câu này:</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    max={q.points}
                    value={essayScores[q.id] ?? ''}
                    onChange={(e) =>
                      setEssayScores((p) => ({ ...p, [q.id]: e.target.value }))
                    }
                    className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">/ {q.points}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-700">
            Đề chỉ có trắc nghiệm — đã chấm tự động. Bạn có thể lưu để xác nhận điểm.
          </div>
        )}

        {/* Trắc nghiệm: xem nhanh */}
        {mcqs.length > 0 && (
          <details className="mb-6 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <summary className="cursor-pointer font-semibold">
              Xem chi tiết trắc nghiệm ({detail.mcqCorrect}/{detail.mcqTotal} đúng)
            </summary>
            <div className="mt-3 space-y-2">
              {mcqs.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-2 border-t border-border/50 pt-2 text-sm first:border-t-0"
                >
                  {q.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <span className="flex-1">
                    <b>Câu {q.questionNumber}:</b> <MathText text={q.content} />
                    <FigureView figure={q.figure} />
                <ChartView chart={q.chart} />
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      HS chọn: <b>{q.selectedOption || '—'}</b> · Đáp án đúng:{' '}
                      <b className="text-emerald-600">{q.correctAnswer || '—'}</b>
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        <Button onClick={save} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Lưu điểm ({liveTotal}/{detail.maxScore ?? 10})
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
