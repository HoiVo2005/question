'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle, Loader2, HelpCircle } from 'lucide-react';

export default function JoinExamPage() {
  const router = useRouter();
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/join-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examCode: examCode.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Không thể vào thi');
        return;
      }

      router.push(`/student/exam/${data.submissionId}`);
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen app-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <LogIn className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Vào thi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập mã đề để bắt đầu làm bài
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Mã đề
            </label>
            <input
              type="text"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase())}
              placeholder="VD: ABC123"
              maxLength={6}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Hỏi giáo viên của bạn để lấy mã đề
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || examCode.length !== 6}
            className="w-full"
            size="lg"
          >
            {loading ? (
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

        <div className="mt-6 border-t border-border/70 pt-6 text-sm text-muted-foreground">
          <p className="mb-3 flex items-center gap-2 font-medium text-foreground">
            <HelpCircle className="h-4 w-4 text-primary" />
            Cần trợ giúp?
          </p>
          <ul className="space-y-2 text-xs">
            <li>• Kiểm tra mã đề có đủ 6 ký tự</li>
            <li>• Hỏi giáo viên xem mã đề có chính xác không</li>
            <li>• Đảm bảo bạn đang dùng mã mới nhất</li>
          </ul>
        </div>
      </div>
    </main>
  );
}