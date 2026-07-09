'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import {
  Bot,
  Upload,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DoorOpen,
  FileUp,
  School,
  Clock,
} from 'lucide-react';

type ExamSource = 'ai' | 'upload' | null;

interface ExamRoomConfig {
  subject: string;
  examName: string;
  setCodes: string[];
  startTime?: string;
  endTime?: string;
  classroomId?: string;
  source?: ExamSource;
}

export default function CreateExamRoomPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [source, setSource] = useState<ExamSource>(null);
  const [config, setConfig] = useState<ExamRoomConfig>({
    subject: '',
    examName: '',
    setCodes: [],
    startTime: '',
    endTime: '',
    source: null,
  });
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);

  useEffect(() => {
    // Load config from sessionStorage
    const storedConfig = sessionStorage.getItem('selectedExamSets');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      setConfig((prev) => ({
        ...prev,
        ...parsed,
      }));
      sessionStorage.removeItem('selectedExamSets');
    }

    // Load classrooms
    if (user && user.id) {
      loadClassrooms();
    }
  }, [user]);

  const loadClassrooms = async () => {
    try {
      const res = await fetch('/api/teacher/classrooms');
      if (res.ok) {
        const data = await res.json();
        setClassrooms(data);
        if (data.length > 0 && !config.classroomId) {
          setConfig((prev) => ({
            ...prev,
            classroomId: data[0].id,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading classrooms:', err);
    }
  };

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!uploadedFile || !answerKeyFile) {
      setError('Vui lòng chọn cả file bộ đề và file đáp án');
      return;
    }

    if (!config.examName) {
      setError('Vui lòng nhập tên bộ đề');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('answerKeyFile', answerKeyFile);
      formData.append('examName', config.examName);

      const response = await fetch('/api/teacher/upload-exam', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải lên bộ đề');
      }

      // Update config with uploaded exam info
      setConfig((prev) => ({
        ...prev,
        subject: data.subject || 'Không xác định',
        examName: data.examName,
        setCodes: data.setCodes,
        source: 'upload',
      }));

      setSource('upload');
      setUploadedFile(null);
      setAnswerKeyFile(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    if (!config.classroomId) {
      setError('Vui lòng chọn lớp học');
      setCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/teacher/create-exam-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo phòng kiểm tra');
      }

      setSuccess('Phòng kiểm tra được tạo thành công!');
      setTimeout(() => {
        router.push(`/teacher/exam/${data.examRoomId}`);
      }, 1500);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';
  const errorBox = (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );

  if (loading) {
    return <PageLoading />;
  }

  // If no source selected, show selection screen
  if (
    !source ||
    (source === 'ai' && !config.setCodes.length) ||
    (source === 'upload' && !config.setCodes.length)
  ) {
    // Check if we have AI config from sessionStorage
    const hasAIConfig = config.setCodes.length > 0 && config.source === undefined;

    if (hasAIConfig) {
      setSource('ai');
    } else if (!source) {
      return (
        <div className="min-h-screen app-bg">
          <AppHeader />
          <main className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
                <DoorOpen className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Tạo phòng kiểm tra
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chọn nguồn bộ đề để mở bài thi
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push('/teacher/generate-exam')}
                className="rounded-2xl border border-border/70 bg-card p-7 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-soft">
                  <Bot className="h-7 w-7" />
                </span>
                <h3 className="mb-1.5 text-lg font-semibold">Bộ đề AI tạo</h3>
                <p className="text-sm text-muted-foreground">
                  Dùng AI tạo bộ đề với nhiều mã đề khác nhau
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSource('upload')}
                className="rounded-2xl border border-border/70 bg-card p-7 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
                  <Upload className="h-7 w-7" />
                </span>
                <h3 className="mb-1.5 text-lg font-semibold">Tải lên bộ đề</h3>
                <p className="text-sm text-muted-foreground">
                  Tải bộ đề từ file Excel, Word hoặc PDF
                </p>
              </button>
            </div>

            {error && <div className="mt-6">{errorBox}</div>}
          </main>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSource(null);
              setConfig({
                subject: '',
                examName: '',
                setCodes: [],
                startTime: '',
                endTime: '',
              });
            }}
          >
            <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Chọn lại</span>
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <DoorOpen className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            {source === 'ai' ? 'Bài thi · Bộ đề AI' : 'Bài thi · Tải lên bộ đề'}
          </h1>
        </div>

        {source === 'upload' && !config.setCodes.length ? (
          // Upload Form
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <FileUp className="h-5 w-5 text-primary" /> Tải lên bộ đề thi
            </h2>

            <form onSubmit={handleUploadExam} className="space-y-5">
              <div>
                <label className={labelCls}>Tên bộ đề</label>
                <input
                  type="text"
                  value={config.examName}
                  onChange={(e) => setConfig({ ...config, examName: e.target.value })}
                  placeholder="VD: Kiểm tra giữa kỳ môn Toán"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>File bộ đề (Excel, Word, PDF)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary`}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Hỗ trợ: Excel (.xlsx), Word (.docx), PDF
                </p>
              </div>

              <div>
                <label className={labelCls}>File đáp án (Excel, Word, PDF)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                  className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary`}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Định dạng: Câu 1: A, Câu 2: B, ... (một dòng cho mỗi mã đề)
                </p>
              </div>

              {error && errorBox}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSource(null)}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button type="submit" disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lên...
                    </>
                  ) : (
                    'Tải lên & tiếp tục'
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // Exam Room Configuration
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <form onSubmit={handleCreateRoom} className="space-y-6">
              {/* Display selected exam info */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-2 font-semibold text-primary">
                  {source === 'ai' ? 'Bộ đề AI được chọn' : 'Bộ đề đã tải lên'}
                </p>
                <p className="mb-0.5 font-medium text-foreground">{config.subject}</p>
                <p className="mb-3 text-sm text-muted-foreground">{config.examName}</p>
                <div className="flex flex-wrap gap-2">
                  {config.setCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-primary/15 px-3 py-1 font-mono text-sm font-medium text-primary"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Classroom selection */}
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  <School className="h-4 w-4" /> Chọn lớp học
                </label>
                <select
                  value={config.classroomId || ''}
                  onChange={(e) => setConfig({ ...config, classroomId: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Chọn lớp học...</option>
                  {classrooms.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - Mã: {cls.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time settings */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={`${labelCls} flex items-center gap-1.5`}>
                    <Clock className="h-4 w-4" /> Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={config.startTime}
                    onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                    className={inputCls}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Học sinh chỉ có thể vào sau thời gian này
                  </p>
                </div>

                <div>
                  <label className={`${labelCls} flex items-center gap-1.5`}>
                    <Clock className="h-4 w-4" /> Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={config.endTime}
                    onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                    className={inputCls}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bài làm sẽ tự động nộp sau thời gian này
                  </p>
                </div>
              </div>

              {error && errorBox}

              {success && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSource(null)}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    'Tạo phòng kiểm tra'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
