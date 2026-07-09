'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { buildBlueprint } from '@/lib/exam-blueprint';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { Sparkles, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { notify } from '@/lib/swal';

const SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Việt',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Khoa học tự nhiên',
  'Lịch sử',
  'Địa lí',
  'Lịch sử và Địa lí',
  'Giáo dục công dân',
  'Giáo dục kinh tế và pháp luật',
  'Tin học',
  'Công nghệ',
  'Khoa học',
  'Tự nhiên và Xã hội',
  'Đạo đức',
];

type Step = 'config' | 'generating' | 'results';

interface ExamSet {
  id: string;
  setCode: string;
  questionCount: number;
}

export default function GenerateExamPage() {
  const router = useRouter();
  const { loading } = useAuth();
  const [step, setStep] = useState<Step>('config');

  // Header
  const [department, setDepartment] = useState('');
  const [school, setSchool] = useState('');
  const [title, setTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState('2025 - 2026');

  // Cấu hình đề
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [mcqCount, setMcqCount] = useState('');
  const [essayCount, setEssayCount] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [setCount, setSetCount] = useState('1');
  const [mcqPoints, setMcqPoints] = useState('');
  const [essayPoints, setEssayPoints] = useState('');

  const [error, setError] = useState('');
  const [generatedSets, setGeneratedSets] = useState<ExamSet[]>([]);

  // Upload đề có sẵn
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadGrade, setUploadGrade] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleUploadExam = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadTitle.trim()) {
      await notify('Vui lòng nhập tên đề trước khi chọn file.', 'warning');
      if (uploadRef.current) uploadRef.current.value = '';
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', uploadTitle);
      fd.append('subject', uploadSubject);
      fd.append('grade', uploadGrade);
      const res = await fetch('/api/teacher/upload-exam-bank', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tải lên thất bại');
      await notify(
        `Đã tải lên đề "${uploadTitle}" với ${data.questionCount} câu` +
          (data.hasAnswers ? `, ${data.hasAnswers} đáp án.` : ' (chưa có đáp án — có thể bổ sung sau).'),
        'success'
      );
      setUploadTitle('');
      router.push('/teacher/dashboard');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const blueprint = useMemo(() => {
    const g = parseInt(grade) || 10;
    return buildBlueprint(g, parseInt(mcqCount) || 0, parseInt(essayCount) || 0);
  }, [grade, mcqCount, essayCount]);

  if (loading) {
    return <PageLoading />;
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const mcq = parseInt(mcqCount) || 0;
    const essay = parseInt(essayCount) || 0;

    if (!subject || !chapter) {
      setError('Vui lòng nhập môn học và bài học/chương.');
      return;
    }
    if (mcq + essay <= 0) {
      setError('Cần ít nhất 1 câu trắc nghiệm hoặc tự luận.');
      return;
    }

    setStep('generating');

    try {
      const response = await fetch('/api/teacher/generate-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseInt(grade),
          subject,
          chapter,
          mcqCount: mcq,
          essayCount: essay,
          durationMinutes: parseInt(durationMinutes) || 45,
          setCount: parseInt(setCount) || 1,
          mcqPoints: parseFloat(mcqPoints) || 0,
          essayPoints: parseFloat(essayPoints) || 0,
          department,
          school,
          title,
          schoolYear,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo đề');

      setGeneratedSets(data.examSets || []);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('config');
    }
  };

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';

  return (
    <div className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/teacher/dashboard">
              <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Quay lại</span>
            </a>
          </Button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Tạo đề thi</h1>
            <p className="text-sm text-muted-foreground">
              Sinh đề chuẩn theo lớp và mức độ tư duy
            </p>
          </div>
        </div>
        {step === 'config' && (
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Tải lên đề có sẵn */}
            <Card className="border-dashed p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                <Upload className="h-5 w-5 text-primary" /> Tải lên đề có sẵn
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Đã có đề từ nguồn khác? Tải file Excel/Word/PDF lên ngân hàng đề.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Tên đề</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="VD: Đề ôn tập chương 1"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Môn học</label>
                  <input
                    className={inputCls}
                    list="subject-list-upload"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    placeholder="Chọn hoặc nhập môn"
                  />
                  <datalist id="subject-list-upload">
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Lớp</label>
                  <select
                    className={inputCls}
                    value={uploadGrade}
                    onChange={(e) => setUploadGrade(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        Lớp {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onChange={handleUploadExam}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => uploadRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1.5 h-4 w-4" /> Chọn file đề
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Excel cột: Câu, Nội dung, Loại, A, B, C, D, Đáp án. Word/PDF sẽ được AI
                  bóc tách.
                </span>
              </div>
            </Card>

            <div className="relative flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase text-muted-foreground">
                hoặc để AI tạo đề mới
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Header đề thi */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Thông tin đầu đề (header)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sở Giáo dục và Đào tạo</label>
                  <input
                    className={inputCls}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: SỞ GD&ĐT NGHỆ AN"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tên trường</label>
                  <input
                    className={inputCls}
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="VD: TRƯỜNG THPT ANH SƠN"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tiêu đề đề thi</label>
                  <input
                    className={inputCls}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: ĐỀ THI THỬ TỐT NGHIỆP THPT LẦN 5"
                  />
                </div>
                <div>
                  <label className={labelCls}>Năm học</label>
                  <input
                    className={inputCls}
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    placeholder="VD: 2025 - 2026"
                  />
                </div>
              </div>
            </Card>

            {/* Cấu hình đề */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Cấu hình đề</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Lớp</label>
                  <select
                    className={inputCls}
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        Lớp {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Môn học</label>
                  <input
                    className={inputCls}
                    list="subject-list"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Chọn hoặc nhập môn"
                  />
                  <datalist id="subject-list">
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={5}
                    max={300}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={labelCls}>Bài học / Chương</label>
                  <textarea
                    className={inputCls}
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder={
                      'Mỗi dòng một nội dung, ví dụ:\nChương 1 - Hàm số và đồ thị\nVectơ và hệ trục toạ độ\nCác số đặc trưng đo mức độ phân tán'
                    }
                    rows={4}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nhấn Enter để xuống dòng, nhập nhiều nội dung/chủ đề.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Số câu trắc nghiệm</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={mcqCount}
                    onChange={(e) => setMcqCount(e.target.value)}
                    min={0}
                    max={60}
                  />
                </div>
                <div>
                  <label className={labelCls}>Số câu tự luận</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={essayCount}
                    onChange={(e) => setEssayCount(e.target.value)}
                    min={0}
                    max={20}
                  />
                </div>
                <div>
                  <label className={labelCls}>Số lượng mã đề</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={setCount}
                    onChange={(e) => setSetCount(e.target.value)}
                    min={1}
                    max={8}
                  />
                </div>
                <div>
                  <label className={labelCls}>Điểm phần trắc nghiệm</label>
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={mcqPoints}
                    onChange={(e) => setMcqPoints(e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <label className={labelCls}>Điểm phần tự luận</label>
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={essayPoints}
                    onChange={(e) => setEssayPoints(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
                    Tổng điểm:{' '}
                    <b className="text-primary">
                      {(parseFloat(mcqPoints) || 0) + (parseFloat(essayPoints) || 0)}
                    </b>{' '}
                    điểm
                  </div>
                </div>
              </div>
            </Card>

            {/* Xem trước ma trận mức độ */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-1">
                Ma trận mức độ (tự động theo lớp {grade})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {blueprint.band === 'primary'
                  ? 'Tiểu học: 3 mức độ theo Thông tư 27.'
                  : 'THCS/THPT: 4 mức độ theo chuẩn Bộ GD&ĐT.'}{' '}
                AI sẽ phân bổ số câu đúng theo bảng dưới.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border-b">Mức độ</th>
                      <th className="p-2 border-b">Trắc nghiệm</th>
                      <th className="p-2 border-b">Tự luận</th>
                      <th className="p-2 border-b">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blueprint.rows.map((r) => (
                      <tr key={r.level.key} className="border-b">
                        <td className="p-2">{r.level.label}</td>
                        <td className="p-2 text-center">{r.mcq}</td>
                        <td className="p-2 text-center">{r.essay}</td>
                        <td className="p-2 text-center font-semibold">{r.total}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="p-2">Tổng cộng</td>
                      <td className="p-2 text-center">{blueprint.totalMcq}</td>
                      <td className="p-2 text-center">{blueprint.totalEssay}</td>
                      <td className="p-2 text-center">{blueprint.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Tạo đề thi bằng AI
            </Button>
          </form>
        )}

        {step === 'generating' && (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">AI đang tạo đề thi...</p>
            <p className="text-sm text-gray-500">
              Lớp {grade} · {subject} · {mcqCount} câu TN + {essayCount} câu TL ·{' '}
              {setCount} mã đề
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Quá trình có thể mất 20–60 giây mỗi mã đề.
            </p>
          </Card>
        )}

        {step === 'results' && (
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">Đã tạo đề thành công</h2>
              <p className="text-gray-600">
                {title || subject} · Lớp {grade} · {generatedSets.length} mã đề
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {generatedSets.map((set) => (
                <div
                  key={set.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-mono font-bold text-lg">Mã đề {set.setCode}</p>
                    <p className="text-xs text-gray-600">{set.questionCount} câu</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/teacher/exam-preview/${set.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Xem / In PDF
                      </Button>
                    </a>
                    <a
                      href={`/api/teacher/exams/${set.id}/export?format=docx&type=exam`}
                    >
                      <Button variant="outline" size="sm">
                        Tải đề (Word)
                      </Button>
                    </a>
                    <a
                      href={`/api/teacher/exams/${set.id}/export?format=docx&type=answer`}
                    >
                      <Button variant="outline" size="sm">
                        Tải đáp án (Word)
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
                {error}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-200 pt-6">
              <Button
                onClick={() => {
                  setStep('config');
                  setError('');
                  setChapter('');
                  setGeneratedSets([]);
                }}
                variant="outline"
                className="w-full"
              >
                Tạo đề mới
              </Button>
              <Button
                onClick={() => router.push('/teacher/dashboard')}
                variant="outline"
                className="w-full"
              >
                Về bảng điều khiển
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}