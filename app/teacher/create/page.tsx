'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { notify } from '@/lib/swal';
import {
  ArrowLeft,
  FileText,
  Upload,
  Pencil,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [passingScore, setPassingScore] = useState('60');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration: parseInt(duration),
          passingScore: parseInt(passingScore),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        await notify(data.error || 'Không thể tạo đề thi', 'error');
        return;
      }

      router.push(`/teacher/exam/${data.examId}/edit`);
    } catch (err) {
      await notify('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
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
              <span className="hidden sm:inline">Quay lại</span>
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tạo đề</h1>
            <p className="text-sm text-muted-foreground">
              Thiết lập thông tin đề thi mới
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-foreground">
                Thông tin đề thi
              </h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đề thi cuối kỳ môn Toán"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung và chủ đề của đề thi"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Thời gian (phút) *
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="15"
                    max="480"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Điểm đạt (%) *
                  </label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link href="/teacher/dashboard">Quay lại</Link>
                </Button>
                <Button type="submit">
                  Tiếp tục: Chọn loại câu hỏi
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">
                Bạn muốn thêm câu hỏi như thế nào?
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft transition hover:shadow-soft-lg"
                  onClick={() => router.push(`/teacher/create?uploadQuestions=true`)}
                >
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
                    <Upload className="h-5 w-5" />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Tải lên câu hỏi
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tải lên tệp chứa câu hỏi có sẵn
                  </p>
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft transition hover:shadow-soft-lg"
                  onClick={() => router.push(`/teacher/exam/${title}/create-manual`)}
                >
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
                    <Pencil className="h-5 w-5" />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Tạo đề thủ công
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Thêm câu hỏi từng câu một
                  </p>
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft transition hover:shadow-soft-lg"
                  onClick={() => router.push(`/teacher/generate-exam`)}
                >
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Tạo bằng AI
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Để AI tạo câu hỏi cho bạn
                  </p>
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-dashed border-border/70 bg-card p-6 text-center shadow-soft transition hover:shadow-soft-lg"
                  onClick={() => setStep(1)}
                >
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">Quay lại</h3>
                  <p className="text-sm text-muted-foreground">
                    Chỉnh sửa thông tin đề thi
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
