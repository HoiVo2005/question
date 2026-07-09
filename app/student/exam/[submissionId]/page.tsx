'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/layout/page-loading';
import { MathText } from '@/components/math-text';
import { FigureView } from '@/components/figure-view';
import { ChartView } from '@/components/chart-view';
import { notify, confirmAction } from '@/lib/swal';
import {
  Clock,
  Upload,
  CheckCircle2,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface ExamData {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes?: number | null;
  startedAt?: string | null;
  questions: Question[];
}

interface Question {
  id: string;
  questionNumber: number;
  content: string;
  type: 'mcq' | 'essay';
  options?: { A: string; B: string; C: string; D: string } | null;
  figure?: any | null;
  chart?: any | null;
}

interface Answer {
  [questionId: string]: string;
}

interface EssayImage {
  [questionId: string]: File | null;
}

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const submissionId = params.submissionId as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Answer>({});
  const [essayImages, setEssayImages] = useState<EssayImage>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasTimer, setHasTimer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (submissionId) {
      fetchExamData();
    }
  }, [submissionId]);

  const fetchExamData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/student/exam/${submissionId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data);

        // Tính hạn nộp: ưu tiên (giờ bắt đầu làm + thời gian làm bài),
        // và không vượt quá giờ đóng phòng (nếu có).
        const dur = Number(data.durationMinutes) || 0;
        let deadline: number | null = null;
        if (data.startedAt && dur > 0) {
          deadline = new Date(data.startedAt).getTime() + dur * 60000;
        }
        const end = data.endTime ? new Date(data.endTime).getTime() : null;
        if (end && (!deadline || end < deadline)) deadline = end;

        if (deadline) {
          const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
          setHasTimer(true);
          setTimeLeft(secondsLeft);
          if (secondsLeft <= 0) handleSubmit();
        } else {
          // Không có giới hạn thời gian -> không tự nộp
          setHasTimer(false);
          setTimeLeft(0);
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!exam || !hasTimer || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, hasTimer]);

  // Auto-save answers every 10 seconds
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;

    const saveInterval = setInterval(async () => {
      try {
        await fetch(`/api/student/exam/${submissionId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
      } catch (error) {
        console.error('Error saving answers:', error);
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [answers, submissionId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));

      // Add essay images
      Object.entries(essayImages).forEach(([questionId, file]) => {
        if (file) {
          formData.append(`essay_${questionId}`, file);
        }
      });

      const res = await fetch(`/api/student/submit-exam`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Submission-ID': submissionId,
        },
      });

      if (res.ok) {
        const { resultId } = await res.json();
        router.push(`/student/results/${resultId}`);
      } else {
        await notify('Lỗi khi nộp bài. Vui lòng thử lại.', 'error');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      await notify('Lỗi khi nộp bài', 'error');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingData || !exam) {
    return <PageLoading label="Đang tải bài thi..." />;
  }

  const question = exam.questions[currentQuestion];
  const timeWarning = timeLeft < 300;
  const isAnswered = (q: Question) => !!answers[q.id] || !!essayImages[q.id];
  const answeredCount = exam.questions.filter(isAnswered).length;
  const progress = Math.round((answeredCount / (exam.questions.length || 1)) * 100);

  return (
    <div className="flex min-h-screen flex-col app-bg">
      <header className="sticky top-0 z-50 glass-header border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'Thoát làm bài?',
                  text: 'Bạn có muốn thoát làm bài không? Bài làm chưa nộp sẽ không được lưu.',
                  confirmText: 'Thoát',
                  icon: 'warning',
                });
                if (ok) router.push('/student/dashboard');
              }}
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Thoát</span>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-foreground sm:text-lg">
                {exam.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Câu {currentQuestion + 1} / {exam.questions.length}
              </p>
            </div>
          </div>
          <div
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-mono font-semibold ${
              hasTimer && timeWarning
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Clock className="h-4 w-4" />
            {hasTimer ? formatTime(timeLeft) : 'Không giới hạn'}
          </div>
        </div>
        {/* Thanh tiến độ */}
        <div className="mx-auto max-w-4xl px-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Đã làm {answeredCount}/{exam.questions.length}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="space-y-6">
          {/* Danh sách câu hỏi (ở trên) */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">Danh sách câu hỏi</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-primary" /> Đang làm
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-200" /> Đã trả lời
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-muted" /> Chưa làm
                </span>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
              {exam.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`aspect-square rounded-lg text-sm font-medium transition ${
                    currentQuestion === idx
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : isAnswered(q)
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {q.questionNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Câu hỏi + phương án trả lời (ở dưới) */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">
                Câu {question.questionNumber}
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {question.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
              </span>
            </div>

            <p className="mb-4 text-lg leading-relaxed text-foreground/90">
              <MathText text={question.content} />
            </p>

            <FigureView figure={question.figure} />
            <ChartView chart={question.chart} />

            {question.type === 'mcq' ? (
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const selected = answers[question.id] === option;
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() =>
                        setAnswers({ ...answers, [question.id]: option })
                      }
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border/70 hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {option}
                      </span>
                      <span className="text-foreground">
                        <MathText
                          text={
                            question.options?.[
                              option as 'A' | 'B' | 'C' | 'D'
                            ] || ''
                          }
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tải lên ảnh bài làm
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEssayImages({ ...essayImages, [question.id]: file });
                    }
                  }}
                  className="block w-full rounded-lg border border-border bg-background text-sm text-muted-foreground outline-none file:mr-4 file:border-0 file:bg-gradient-to-br file:from-indigo-500 file:to-violet-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white focus:ring-2 focus:ring-primary/40"
                />
                {essayImages[question.id] && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã tải lên {essayImages[question.id]!.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Điều hướng */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Câu trước
            </Button>

            {currentQuestion < exam.questions.length - 1 ? (
              <Button
                className="sm:flex-1"
                onClick={() =>
                  setCurrentQuestion(
                    Math.min(exam.questions.length - 1, currentQuestion + 1)
                  )
                }
              >
                Câu sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 sm:flex-1"
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-soft-lg">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-foreground">Nộp bài?</h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Bạn có chắc muốn nộp bài? Bạn sẽ không thể chỉnh sửa sau khi nộp.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}