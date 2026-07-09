'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { formatDateVi } from '@/lib/format';
import Link from 'next/link';
import { ClipboardCheck, FileText, ClipboardList } from 'lucide-react';

interface PendingSubmission {
  id: string;
  studentName: string;
  examName: string;
  classroomName: string;
  submittedAt: string;
  mcqScore: number;
  essayCount: number;
}

export default function GradingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPendingSubmissions();
    }
  }, [user]);

  const fetchPendingSubmissions = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/teacher/grading/pending');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  const filteredSubmissions =
    filter === 'essays'
      ? submissions.filter((s) => s.essayCount > 0)
      : submissions;

  return (
    <div className="min-h-screen app-bg">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Chấm bài</h1>
              <p className="text-sm text-muted-foreground">Bài chờ chấm</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tất cả ({submissions.length})
            </Button>
            <Button
              variant={filter === 'essays' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('essays')}
            >
              Tự luận ({submissions.filter((s) => s.essayCount > 0).length})
            </Button>
          </div>
        </div>

        {loadingData ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : filteredSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-12 text-center shadow-soft">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ClipboardCheck className="h-7 w-7" />
            </span>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              Chưa có bài nộp nào
            </h3>
            <p className="text-sm text-muted-foreground">
              Tất cả bài thi đã được chấm xong!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition hover:shadow-soft-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {submission.studentName}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 shrink-0" />
                      {submission.examName}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">Lớp học:</span>{' '}
                        {submission.classroomName}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">Nộp lúc:</span>{' '}
                        {formatDateVi(submission.submittedAt)}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          Điểm trắc nghiệm:
                        </span>{' '}
                        {submission.mcqScore}
                      </span>
                      {submission.essayCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {submission.essayCount} câu tự luận
                        </span>
                      )}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/teacher/grading/${submission.id}`}>
                      <ClipboardCheck className="mr-1.5 h-4 w-4" />
                      Chấm
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}