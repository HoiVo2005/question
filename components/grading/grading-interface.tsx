'use client';

import { useState } from 'react';
import { StudentAnswer, Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';

interface GradingInterfaceProps {
  questions: Question[];
  answers: StudentAnswer[];
  onGradeEssay: (answerId: string, points: number, comment: string) => Promise<void>;
  maxScore: number;
}

export function GradingInterface({
  questions,
  answers,
  onGradeEssay,
  maxScore,
}: GradingInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [essayGrades, setEssayGrades] = useState<
    Record<string, { points: number; comment: string }>
  >({});

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);

  const handleGradeEssay = async () => {
    if (!currentAnswer) return;

    setLoading(true);
    try {
      const grade = essayGrades[currentAnswer.id] || { points: 0, comment: '' };
      await onGradeEssay(currentAnswer.id, grade.points, grade.comment);
      setCurrentIndex(Math.min(currentIndex + 1, questions.length - 1));
    } finally {
      setLoading(false);
    }
  };

  if (!currentQuestion || !currentAnswer) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-soft">
        Không có câu hỏi nào để chấm
      </div>
    );
  }

  const isEssay = currentQuestion.type === 'essay';
  const isMCQ = currentQuestion.type === 'mcq';
  const gradedCount = answers.filter(
    (a) => a.earnedPoints !== null && a.earnedPoints !== undefined
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Câu {currentIndex + 1} / {questions.length}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEssay ? 'Câu tự luận' : 'Câu trắc nghiệm'}
          </p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
          Đã chấm <span className="font-semibold text-foreground">{gradedCount}</span> /{' '}
          {answers.length}
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-lg font-semibold">{currentQuestion.questionText}</h3>

        {currentQuestion.questionImage && (
          <img
            src={currentQuestion.questionImage}
            alt="Hình câu hỏi"
            className="mb-4 h-auto max-w-full rounded-lg border"
          />
        )}

        {isMCQ && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Câu trả lời của học sinh:
              </p>
              <p className="text-lg font-bold text-primary">
                {currentAnswer.selectedOption}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                currentAnswer.isCorrect ? 'bg-emerald-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`flex items-center gap-1.5 text-lg font-semibold ${
                  currentAnswer.isCorrect ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {currentAnswer.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Trả lời đúng
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" /> Trả lời sai
                  </>
                )}
              </p>
              {currentQuestion.explanation && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-primary/5 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Điểm đạt được:
              </p>
              <p className="text-2xl font-bold text-primary">
                {currentAnswer.earnedPoints}/{currentQuestion.points}
              </p>
            </div>
          </div>
        )}

        {isEssay && (
          <div className="space-y-4">
            {currentAnswer.essayImageUrl && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Ảnh bài làm của học sinh:
                </p>
                <img
                  src={currentAnswer.essayImageUrl}
                  alt="Bài làm của học sinh"
                  className="h-auto max-h-96 max-w-full rounded-lg border"
                />
              </div>
            )}

            {currentAnswer.essayText && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Bài làm dạng văn bản:
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-foreground">{currentAnswer.essayText}</p>
                </div>
              </div>
            )}

            {/* Grading Form */}
            <div className="space-y-4 border-t border-border pt-5">
              <h4 className="flex items-center gap-2 font-semibold">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Chấm câu này
              </h4>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Điểm cho câu này (tối đa {currentQuestion.points})
                </label>
                <input
                  type="number"
                  min="0"
                  max={currentQuestion.points}
                  value={essayGrades[currentAnswer.id]?.points || 0}
                  onChange={(e) =>
                    setEssayGrades((prev) => ({
                      ...prev,
                      [currentAnswer.id]: {
                        ...prev[currentAnswer.id],
                        points: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Nhận xét (không bắt buộc)
                </label>
                <textarea
                  value={essayGrades[currentAnswer.id]?.comment || ''}
                  onChange={(e) =>
                    setEssayGrades((prev) => ({
                      ...prev,
                      [currentAnswer.id]: {
                        ...prev[currentAnswer.id],
                        comment: e.target.value,
                      },
                    }))
                  }
                  placeholder="Đưa ra nhận xét để giúp học sinh tiến bộ..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  rows={3}
                />
              </div>

              <Button onClick={handleGradeEssay} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Lưu điểm
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Câu trước
        </Button>

        <Button
          onClick={() =>
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
          }
          disabled={currentIndex === questions.length - 1}
        >
          Câu sau <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}