'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import Link from 'next/link';
import { Question, StudentAnswer } from '@/lib/types';
import { formatDateVi } from '@/lib/format';
import { MathText } from '@/components/math-text';
import { FigureView } from '@/components/figure-view';
import { ChartView } from '@/components/chart-view';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface ResultData {
  examTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  status: string;
  submittedAt: string;
  questions: Question[];
  answers: StudentAnswer[];
  teacherFeedback?: string;
}

export default function ResultsPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const router = useRouter();

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!submissionId) return;
    loadResults();
  }, [submissionId]);

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/student/results/${submissionId}`);
      const data = await response.json();
      setResult(response.ok ? data : null);
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading label="Đang tải kết quả..." />;
  }

  if (!result) {
    return (
      <div className="min-h-screen app-bg">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </span>
            <p className="mb-4 text-muted-foreground">Không tìm thấy kết quả</p>
            <Button asChild>
              <Link href="/student/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const passed = result.percentage >= 50;

  return (
    <div className="min-h-screen app-bg">
      <AppHeader />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{result.examTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Kết quả · Nộp lúc {formatDateVi(result.submittedAt)}
          </p>
        </div>

        {/* Score Card / Chờ chấm */}
        {result.status === 'graded' ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
              <Trophy className="h-7 w-7" />
            </span>

            <div
              className={`mx-auto mb-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 ${
                passed
                  ? 'border-emerald-200 text-emerald-600'
                  : 'border-destructive/30 text-destructive'
              }`}
            >
              <span className="text-4xl font-bold leading-none">
                {(
                  ((result.totalScore || 0) / (result.maxScore || 1)) *
                  10
                ).toFixed(1)}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">/ 10 điểm</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Đúng {(result.percentage ?? 0).toFixed(0)}% · Xếp loại:{' '}
              <span className="font-semibold text-foreground">{result.grade}</span>
            </p>

            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã chấm
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center shadow-soft">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Clock className="h-7 w-7" />
            </span>
            <h2 className="text-xl font-bold text-amber-800">Bài thi đang chờ chấm</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-amber-700">
              Bạn đã nộp bài thành công. Phần tự luận đang được giáo viên chấm — điểm và
              kết quả chi tiết sẽ hiển thị sau khi chấm xong.
            </p>
            <p className="mt-3 text-xs text-amber-700/80">
              Nộp lúc {formatDateVi(result.submittedAt)}
            </p>
          </div>
        )}

        {/* Feedback */}
        {result.teacherFeedback && (
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Nhận xét của giáo viên
            </h3>
            <p className="text-sm text-foreground/80">{result.teacherFeedback}</p>
          </div>
        )}

        {/* Question Breakdown */}
        {result.status === 'graded' && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Chi tiết câu hỏi</h2>
          <div className="space-y-4">
            {result.questions.map((question, index) => {
              const answer = result.answers.find((a) => a.questionId === question.id);
              const isExpanded = expandedAnswers.has(question.id);
              const fullMark =
                answer && answer.earnedPoints !== null
                  ? answer.earnedPoints === question.points
                  : null;

              return (
                <div
                  key={question.id}
                  className="cursor-pointer rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition hover:shadow-soft-lg"
                  onClick={() => {
                    const newExpanded = new Set(expandedAnswers);
                    if (newExpanded.has(question.id)) {
                      newExpanded.delete(question.id);
                    } else {
                      newExpanded.add(question.id);
                    }
                    setExpandedAnswers(newExpanded);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-foreground">
                        Câu {index + 1}: <MathText text={question.questionText} />
                      </h3>
                      <FigureView figure={question.figure} />
                      <ChartView chart={question.chart} />
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {question.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                        <span className="text-muted-foreground">
                          Điểm: {question.points}
                        </span>
                        {answer && answer.earnedPoints !== null && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              fullMark
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            Đạt: {answer.earnedPoints}/{question.points}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {isExpanded && answer && (
                    <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
                      {question.type === 'mcq' && (
                        <div>
                          <p className="mb-1 text-sm font-medium text-muted-foreground">
                            Đáp án của bạn:
                          </p>
                          <p
                            className={`flex items-center gap-1.5 text-lg font-semibold ${
                              answer.isCorrect ? 'text-emerald-600' : 'text-destructive'
                            }`}
                          >
                            {answer.isCorrect ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                            {answer.selectedOption || 'Chưa trả lời'}
                          </p>
                          {question.explanation && (
                            <div className="mt-2 rounded-lg bg-muted/50 p-3">
                              <p className="text-sm text-foreground/80">
                                <MathText text={question.explanation} />
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {question.type === 'essay' && (
                        <div className="space-y-3">
                          {answer.essayImageUrl && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-muted-foreground">
                                Ảnh bài làm của bạn:
                              </p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={answer.essayImageUrl}
                                alt="Bài làm của bạn"
                                className="h-auto max-h-64 max-w-full rounded-lg border border-border/70"
                              />
                            </div>
                          )}

                          {answer.essayText && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-muted-foreground">
                                Bài làm dạng văn bản:
                              </p>
                              <p className="text-sm text-foreground/80">
                                {answer.essayText}
                              </p>
                            </div>
                          )}

                          {answer.gradeComment && (
                            <div className="rounded-lg bg-primary/5 p-3">
                              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Nhận xét của giáo viên:
                              </p>
                              <p className="text-sm text-foreground/80">
                                {answer.gradeComment}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/student/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}