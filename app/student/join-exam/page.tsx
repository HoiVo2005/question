'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import Link from 'next/link';
import { LogIn, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { notify } from '@/lib/swal';

export default function JoinExamPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJoining(true);

    try {
      const res = await fetch('/api/student/join-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || 'Không thể vào thi';
        setError(msg);
        // Hết giờ / chưa tới giờ / không thuộc lớp / không tìm thấy => cảnh báo
        await notify(msg, res.status === 500 ? 'error' : 'warning');
        return;
      }

      const { submissionId } = await res.json();
      router.push(`/student/exam/${submissionId}`);
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      await notify('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen app-bg">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
              <LogIn className="h-7 w-7" />
            </span>
            <h2 className="text-2xl font-bold text-foreground">Vào thi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập mã bài thi để bắt đầu làm bài
            </p>
          </div>

          <form onSubmit={handleJoinExam} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Mã bài thi
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="VD: HFF2TS"
                required
                disabled={joining}
                maxLength={10}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Nhập mã bài thi giáo viên cung cấp. Đề thi sẽ được chọn ngẫu nhiên.
                Bạn cần đã được thêm vào lớp.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={joining}>
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang vào thi...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Vào thi
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}