'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { parseAnswerKeyFile } from '@/lib/file-processing';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { formatDateVi } from '@/lib/format';
import { confirmDelete, toast, notify } from '@/lib/swal';
import {
  FileText,
  KeyRound,
  Settings,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  Copy,
} from 'lucide-react';

interface ExamDetail {
  id: string;
  name: string;
  setCode: string;
  classroomId: string;
  classroomName: string;
  createdAt: string;
}

interface Question {
  id: string;
  questionNumber: number;
  content: string;
  type: 'mcq' | 'essay';
}

interface AnswerKey {
  [questionNumber: number]: string;
}

export default function ExamManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerKey, setAnswerKey] = useState<AnswerKey>({});
  const [tab, setTab] = useState<'questions' | 'answer-key' | 'settings'>('questions');
  const [loadingData, setLoadingData] = useState(false);
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'mcq' | 'essay'>('mcq');
  const [uploadingAnswerKey, setUploadingAnswerKey] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const fetchExamData = async () => {
    setLoadingData(true);
    try {
      const [examRes, questionsRes, answerKeyRes] = await Promise.all([
        fetch(`/api/teacher/exams/${examId}`),
        fetch(`/api/teacher/exams/${examId}/questions`),
        fetch(`/api/teacher/exams/${examId}/answer-key`),
      ]);

      if (examRes.ok) setExam(await examRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
      if (answerKeyRes.ok) {
        const data = await answerKeyRes.json();
        setAnswerKey(data.answers || {});
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    try {
      const res = await fetch(`/api/teacher/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newQuestionContent,
          type: newQuestionType,
          questionNumber: questions.length + 1,
        }),
      });

      if (res.ok) {
        setNewQuestionContent('');
        fetchExamData();
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const handleUploadAnswerKey = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAnswerKey(true);
    try {
      const parsedAnswers = await parseAnswerKeyFile(file);

      if (!parsedAnswers) {
        await notify('Không đọc được file đáp án. Vui lòng kiểm tra định dạng.', 'error');
        return;
      }

      const res = await fetch(`/api/teacher/exams/${examId}/answer-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: parsedAnswers,
          fileName: file.name,
        }),
      });

      if (res.ok) {
        setAnswerKey(parsedAnswers);
        await toast('Tải lên đáp án thành công');
        fetchExamData();
      }
    } catch (error) {
      console.error('Error uploading answer key:', error);
      await notify('Lỗi khi tải lên đáp án', 'error');
    } finally {
      setUploadingAnswerKey(false);
      e.target.value = '';
    }
  };

  const handleStartTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    try {
      const res = await fetch(`/api/teacher/exams/${examId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      if (res.ok) {
        setTimerStarted(true);
        await notify('Đã bắt đầu tính giờ! Học sinh có thể vào làm bài.', 'success');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  if (loading) return <PageLoading />;

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';

  const tabs = [
    { key: 'questions', label: `Câu hỏi (${questions.length})`, icon: FileText },
    { key: 'answer-key', label: 'Đáp án', icon: KeyRound },
    { key: 'settings', label: 'Cài đặt', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen app-bg">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Tiêu đề đề + mã đề */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <h1 className="text-2xl font-bold text-foreground">{exam?.name || 'Đề thi'}</h1>
          {exam && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                Mã đề:
                <code className="rounded-md bg-primary/10 px-2 py-1 font-mono font-semibold text-primary">
                  {exam.setCode}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(exam.setCode);
                    toast('Đã sao chép');
                  }}
                  className="text-muted-foreground transition hover:text-primary"
                  title="Sao chép mã"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </span>
              <span>· Chia sẻ mã này để học sinh vào làm bài</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-soft">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'questions' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="mb-4 font-semibold text-foreground">Thêm câu hỏi thủ công</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className={labelCls}>Câu {questions.length + 1}</label>
                  <textarea
                    value={newQuestionContent}
                    onChange={(e) => setNewQuestionContent(e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                    className={inputCls}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Loại câu hỏi</label>
                  <select
                    value={newQuestionType}
                    onChange={(e) =>
                      setNewQuestionType(e.target.value as 'mcq' | 'essay')
                    }
                    className={inputCls}
                  >
                    <option value="mcq">Trắc nghiệm (ABCD)</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <Button type="submit">
                  <Plus className="mr-1.5 h-4 w-4" /> Thêm câu hỏi
                </Button>
              </form>
            </div>

            <div className="space-y-3">
              {loadingData ? (
                <p className="text-muted-foreground">Đang tải câu hỏi...</p>
              ) : questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-soft">
                  Chưa có câu hỏi nào.
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          Câu {question.questionNumber}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {question.content}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {question.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          const ok = await confirmDelete({
                            title: 'Xoá câu hỏi?',
                            text: `Câu ${question.questionNumber} sẽ bị xoá.`,
                          });
                          if (ok) {
                            await fetch(
                              `/api/teacher/exams/${examId}/questions/${question.id}`,
                              { method: 'DELETE' }
                            );
                            await toast('Đã xoá câu hỏi');
                            fetchExamData();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'answer-key' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                <Upload className="h-4 w-4 text-primary" /> Tải lên đáp án
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Tải file CSV, Excel hoặc PDF chứa đáp án. Định dạng: Số câu, Đáp án.
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleUploadAnswerKey}
                disabled={uploadingAnswerKey}
                className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary`}
              />
              {uploadingAnswerKey && (
                <p className="mt-2 text-sm text-muted-foreground">Đang tải lên...</p>
              )}
            </div>

            {Object.keys(answerKey).length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                <h3 className="mb-4 font-semibold text-foreground">Đáp án hiện tại</h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8">
                  {Object.entries(answerKey).map(([qNum, answer]) => (
                    <div
                      key={qNum}
                      className="rounded-lg border border-border bg-muted/40 p-2 text-center"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        Câu {qNum}
                      </p>
                      <p className="text-lg font-bold text-primary">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Lịch thi
            </h3>
            {!timerStarted ? (
              <form onSubmit={handleStartTimer} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Thời gian bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Thời gian kết thúc</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <Button type="submit">Bắt đầu tính giờ</Button>
              </form>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Đang trong thời gian thi</p>
                  <p className="mt-1 text-sm">Bắt đầu: {formatDateVi(startTime)}</p>
                  <p className="text-sm">Kết thúc: {formatDateVi(endTime)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
