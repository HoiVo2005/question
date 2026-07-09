'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { formatDateVi } from '@/lib/format';
import { ArrowLeft, Users, ClipboardCheck, Eye } from 'lucide-react';

interface StudentSubmission {
  id: string;
  student: {
    name: string;
    email: string;
  };
  status: 'in_progress' | 'submitted' | 'graded';
  submittedAt: string;
  totalScore?: number;
  maxScore?: number;
  grade?: string;
}

const STATUS = {
  in_progress: { label: 'Đang làm', cls: 'bg-sky-100 text-sky-700' },
  submitted: { label: 'Đã nộp', cls: 'bg-amber-100 text-amber-700' },
  graded: { label: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-700' },
} as const;

export default function SubmissionsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    loadSubmissions();
  }, [examId]);

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`/api/teacher/exam/${examId}/submissions`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Không tải được bài nộp:', err);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bài nộp của học sinh</h1>
            <p className="text-sm text-muted-foreground">
              {submissions.length} bài nộp
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-muted-foreground shadow-soft">
            Đang tải bài nộp...
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">Chưa có bài nộp nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bài nộp của học sinh sẽ hiển thị ở đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
              const st = STATUS[submission.status] ?? STATUS.in_progress;
              return (
                <div
                  key={submission.id}
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:shadow-soft-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{submission.student.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {submission.student.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Nộp lúc:{' '}
                          {submission.submittedAt
                            ? formatDateVi(submission.submittedAt)
                            : 'Chưa nộp'}
                        </span>
                        {submission.status === 'graded' &&
                          submission.totalScore != null &&
                          submission.maxScore != null && (
                            <span className="font-semibold text-primary">
                              Điểm: {submission.totalScore}/{submission.maxScore}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/teacher/exam/${examId}/grade/${submission.id}`}>
                          {submission.status === 'graded' ? (
                            <>
                              <Eye className="mr-1 h-3.5 w-3.5" /> Xem
                            </>
                          ) : (
                            <>
                              <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Chấm
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
