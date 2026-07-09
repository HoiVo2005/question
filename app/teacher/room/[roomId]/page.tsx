'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { formatDateVi } from '@/lib/format';
import { ArrowLeft, Users, CheckCircle2, ClipboardCheck, Eye } from 'lucide-react';

interface RoomSubmission {
  id: string;
  studentName: string;
  email: string;
  setCode: string;
  correctCount: number;
  totalQuestions: number;
  totalScore: number | null;
  maxScore: number | null;
  status: string;
  submittedAt: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  in_progress: { label: 'Đang làm', cls: 'bg-sky-100 text-sky-700' },
  submitted: { label: 'Chờ chấm', cls: 'bg-amber-100 text-amber-700' },
  graded: { label: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function RoomSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [roomName, setRoomName] = useState('');
  const [subs, setSubs] = useState<RoomSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) load();
  }, [roomId]);

  const load = async () => {
    try {
      const res = await fetch(`/api/teacher/rooms/${roomId}/submissions`);
      const data = await res.json();
      if (res.ok) {
        setRoomName(data.roomName || 'Bài thi');
        setSubs(data.submissions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  const graded = subs.filter((s) => s.status === 'graded').length;
  const pending = subs.filter((s) => s.status === 'submitted').length;

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

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kết quả thi</h1>
            <p className="text-sm text-muted-foreground">
              {roomName} · {subs.length} đã tham gia · {pending} chờ chấm · {graded} đã
              chấm
            </p>
          </div>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-soft">
            Chưa có học sinh nào nộp bài thi này.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="hidden items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-2.5 text-xs font-semibold uppercase text-muted-foreground sm:flex">
              <span className="w-7 text-center">STT</span>
              <span className="flex-1">Học sinh</span>
              <span className="w-24 text-center">Câu đúng</span>
              <span className="w-20 text-center">Điểm</span>
              <span className="w-24 text-center">Thao tác</span>
            </div>
            {subs.map((s, i) => {
              const st = STATUS[s.status] || STATUS.submitted;
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 border-t border-border/60 px-5 py-3.5 first:border-t-0 sm:flex-row sm:items-center"
                >
                  <span className="hidden w-7 text-center text-sm font-semibold text-muted-foreground sm:block">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{s.studentName}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.email} · Mã đề {s.setCode} · {formatDateVi(s.submittedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-semibold sm:w-24 sm:justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {s.correctCount}/{s.totalQuestions}
                  </div>

                  <div className="text-sm font-bold sm:w-20 sm:text-center">
                    <span className={s.status === 'graded' ? 'text-primary' : 'text-muted-foreground'}>
                      {s.totalScore != null ? s.totalScore : '—'}
                    </span>
                    <span className="font-normal text-muted-foreground">
                      /{s.maxScore ?? 10}
                    </span>
                  </div>

                  <div className="sm:w-24 sm:text-center">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/teacher/grade/${s.id}`}>
                        {s.status === 'graded' ? (
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
