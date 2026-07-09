'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { notify, toast } from '@/lib/swal';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ImageIcon,
  Trophy,
  ClipboardList,
  Save,
  Loader2,
} from 'lucide-react';

interface Question {
  id: string;
  questionNumber: number;
  content: string;
  type: 'mcq' | 'essay';
  correctAnswer?: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
  essayImageUrl?: string;
  earnedPoints?: number;
}

interface GradingData {
  studentName: string;
  examName: string;
  classroomName: string;
  mcqScore: number;
  maxMcqScore: number;
  questions: Question[];
}

export default function GradingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const submissionId = params.submissionId as string;

  const [data, setData] = useState<GradingData | null>(null);
  const [essayScores, setEssayScores] = useState<{ [key: string]: number }>({});
  const [savingScores, setSavingScores] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (submissionId) {
      fetchGradingData();
    }
  }, [submissionId]);

  const fetchGradingData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/teacher/grading/${submissionId}`);
      if (res.ok) {
        const gradingData = await res.json();
        setData(gradingData);

        // Initialize essay scores
        const scores: { [key: string]: number } = {};
        gradingData.questions.forEach((q: Question) => {
          if (q.type === 'essay') {
            scores[q.id] = q.earnedPoints || 0;
          }
        });
        setEssayScores(scores);
      }
    } catch (error) {
      console.error('Error fetching grading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveScores = async () => {
    setSavingScores(true);
    try {
      const essayQuestionsWithScores = data?.questions
        .filter((q) => q.type === 'essay')
        .reduce((acc, q) => {
          acc[q.id] = essayScores[q.id];
          return acc;
        }, {} as { [key: string]: number });

      const res = await fetch(`/api/teacher/grading/${submissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayScores: essayQuestionsWithScores,
        }),
      });

      if (res.ok) {
        await toast('Đã lưu điểm thành công!');
        router.push('/teacher/grading');
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      await notify('Lỗi khi lưu điểm', 'error');
    } finally {
      setSavingScores(false);
    }
  };

  if (loadingData || !data) {
    return <PageLoading label="Đang tải..." />;
  }

  const essayQuestions = data.questions.filter((q) => q.type === 'essay');
  const mcqQuestions = data.questions.filter((q) => q.type === 'mcq');

  return (
    <div className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/grading">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {data.studentName}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {data.examName}
          </p>
        </div>

        {/* Score Summary */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Tổng điểm
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="mb-1 text-sm text-sky-700">Điểm trắc nghiệm</p>
              <p className="text-2xl font-bold text-sky-900">
                {data.mcqScore}/{data.maxMcqScore}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-sm text-amber-700">Câu tự luận cần chấm</p>
              <p className="text-2xl font-bold text-amber-900">
                {essayQuestions.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-1 text-sm text-muted-foreground">Lớp học</p>
              <p className="text-lg font-bold text-foreground">
                {data.classroomName}
              </p>
            </div>
          </div>
        </div>

        {/* MCQ Review */}
        {mcqQuestions.length > 0 && (
          <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Trắc nghiệm
            </h3>
            <div className="space-y-4">
              {mcqQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`rounded-xl border-l-4 p-4 ${
                    q.isCorrect
                      ? 'border-l-emerald-500 bg-emerald-50'
                      : 'border-l-red-500 bg-red-50'
                  }`}
                >
                  <div className="mb-2 flex items-start gap-2">
                    {q.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    )}
                    <p className="font-medium text-foreground">
                      Câu hỏi {q.questionNumber}: {q.content}
                    </p>
                  </div>
                  <div className="grid gap-4 pl-7 text-sm md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-muted-foreground">
                        Câu trả lời của học sinh:
                      </p>
                      <p
                        className={`font-medium ${
                          q.isCorrect ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {q.selectedAnswer || 'Chưa trả lời'}
                      </p>
                    </div>
                    {!q.isCorrect && (
                      <div>
                        <p className="mb-1 text-muted-foreground">Đáp án đúng:</p>
                        <p className="font-medium text-emerald-700">
                          {q.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Essay Grading */}
        {essayQuestions.length > 0 && (
          <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Tự luận
            </h3>
            <div className="space-y-6">
              {essayQuestions.map((q) => (
                <div
                  key={q.id}
                  className="border-b border-border/70 pb-6 last:border-b-0 last:pb-0"
                >
                  <p className="mb-4 font-medium text-foreground">
                    Câu hỏi {q.questionNumber}: {q.content}
                  </p>

                  {q.essayImageUrl && (
                    <div className="mb-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        Ảnh bài làm
                      </p>
                      <img
                        src={q.essayImageUrl}
                        alt={`Ảnh bài làm câu ${q.questionNumber}`}
                        className="h-auto max-w-full rounded-lg border border-border"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Điểm cho câu này ({essayScores[q.id]} / 1)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.5"
                      value={essayScores[q.id] || 0}
                      onChange={(e) =>
                        setEssayScores({
                          ...essayScores,
                          [q.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-32 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/teacher/grading">Quay lại</Link>
          </Button>
          <Button onClick={handleSaveScores} disabled={savingScores}>
            {savingScores ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Hoàn tất chấm
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}