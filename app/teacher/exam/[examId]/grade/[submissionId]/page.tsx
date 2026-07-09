'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GradingInterface } from '@/components/grading/grading-interface';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import Link from 'next/link';
import { Question, StudentAnswer } from '@/lib/types';
import { ArrowLeft, CheckCircle2, User, FileText } from 'lucide-react';

export default function GradeSubmissionPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const examId = params.examId as string;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    if (!submissionId) return;
    loadGradingData();
  }, [submissionId]);

  const loadGradingData = async () => {
    try {
      const response = await fetch(
        `/api/teacher/exam/${examId}/submissions/${submissionId}`
      );
      const data = await response.json();

      setQuestions(data.questions || []);
      setAnswers(data.answers || []);
      setStudentName(data.studentName || '');
      setMaxScore(data.maxScore || 0);
    } catch (err) {
      console.error('Failed to load grading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeEssay = async (
    answerId: string,
    points: number,
    comment: string
  ) => {
    try {
      const response = await fetch(
        `/api/teacher/exam/${examId}/submissions/${submissionId}/grade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerId,
            earnedPoints: points,
            gradeComment: comment,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save grade');

      // Reload data
      loadGradingData();
    } catch (err) {
      console.error('Error saving grade:', err);
    }
  };

  if (loading) {
    return <PageLoading label="Đang tải..." />;
  }

  return (
    <div className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/teacher/exam/${examId}/submissions`}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <FileText className="h-6 w-6 text-primary" />
              Chấm bài
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Học sinh: {studentName}
            </p>
          </div>
          <Button asChild>
            <Link href={`/teacher/exam/${examId}/submissions`}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Hoàn tất chấm
            </Link>
          </Button>
        </div>

        {/* Content */}
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-12 text-center shadow-soft">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="h-7 w-7" />
            </span>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              Chưa có câu hỏi nào
            </h3>
            <p className="text-sm text-muted-foreground">
              Bài nộp này không có câu hỏi để chấm.
            </p>
          </div>
        ) : (
          <GradingInterface
            questions={questions}
            answers={answers}
            onGradeEssay={handleGradeEssay}
            maxScore={maxScore}
          />
        )}
      </main>
    </div>
  );
}