'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { FullExam } from '@/lib/exam-data';
import { MathText } from '@/components/math-text';
import { FigureView } from '@/components/figure-view';
import { ChartView } from '@/components/chart-view';
import { Printer, X, Eye } from 'lucide-react';

export default function ExamPreviewPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [exam, setExam] = useState<FullExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teacher/exams/${examId}/full`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không tải được đề');
        setExam(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error || !exam)
    return (
      <div className="p-8 text-center text-red-600">{error || 'Không có dữ liệu'}</div>
    );

  const mcq = exam.questions.filter((q) => q.type === 'mcq');
  const essay = exam.questions.filter((q) => q.type === 'essay');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Thanh công cụ (ẩn khi in) */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(e) => setShowAnswers(e.target.checked)}
          />
          <Eye className="h-4 w-4" /> Hiện đáp án &amp; lời giải
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" /> In / Lưu PDF
          </button>
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
          >
            <X className="h-4 w-4" /> Đóng
          </button>
        </div>
      </div>

      {/* Trang giấy A4 */}
      <div className="print-sheet mx-auto my-6 bg-white shadow-md" id="sheet">
        {/* Header 2 cột */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-bold uppercase leading-snug">
              {exam.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
            </p>
            {exam.school && (
              <p className="font-bold uppercase leading-snug">{exam.school}</p>
            )}
            <p className="mt-2">--------------------</p>
          </div>
          <div>
            <p className="font-bold uppercase leading-snug">
              {exam.title || 'ĐỀ KIỂM TRA'}
            </p>
            <p className="font-bold uppercase">NĂM HỌC {exam.schoolYear || ''}</p>
            <p className="font-bold uppercase">MÔN: {exam.subject || ''}</p>
            <p className="italic">Thời gian làm bài: {exam.durationMinutes || 45} phút</p>
            <p className="text-sm italic">(không kể thời gian phát đề)</p>
          </div>
        </div>

        <div className="mb-2 mt-4 flex items-end justify-between text-sm">
          <p>
            Họ và tên thí sinh: ............................................. Số báo
            danh: ................
          </p>
          <p className="whitespace-nowrap font-bold">Mã đề: {exam.setCode}</p>
        </div>

        {showAnswers && (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            <b>Bảng đáp án trắc nghiệm:</b>{' '}
            {mcq.map((q) => `${q.questionNumber}-${q.correctAnswer || '?'}`).join('; ')}
          </div>
        )}

        {/* Trắc nghiệm */}
        {mcq.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-base font-bold">PHẦN I. TRẮC NGHIỆM</h2>
            {mcq.map((q) => (
              <div key={q.questionNumber} className="break-inside-avoid mb-3">
                <p>
                  <b>Câu {q.questionNumber}:</b> <MathText text={q.content} />
                </p>
                <FigureView figure={q.figure} />
                <ChartView chart={q.chart} />
                {q.options && (
                  <div className="grid grid-cols-1 gap-x-6 pl-5 sm:grid-cols-2">
                    {(['A', 'B', 'C', 'D'] as const).map((k) => {
                      const correct = showAnswers && q.correctAnswer === k;
                      return (
                        <p
                          key={k}
                          className={correct ? 'font-semibold text-green-700' : ''}
                        >
                          <b>{k}.</b> <MathText text={q.options![k]} />
                          {correct ? ' ✓' : ''}
                        </p>
                      );
                    })}
                  </div>
                )}
                {showAnswers && q.explanation && (
                  <p className="mt-1 pl-5 text-sm italic text-gray-600">
                    Lời giải: <MathText text={q.explanation} />
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Tự luận */}
        {essay.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 text-base font-bold">PHẦN II. TỰ LUẬN</h2>
            {essay.map((q) => (
              <div key={q.questionNumber} className="break-inside-avoid mb-3">
                <p>
                  <b>
                    Câu {q.questionNumber}
                    {q.points ? ` (${q.points} điểm)` : ''}:
                  </b>{' '}
                  <MathText text={q.content} />
                </p>
                <FigureView figure={q.figure} />
                <ChartView chart={q.chart} />
                {showAnswers && (q.modelAnswer || q.explanation) && (
                  <p className="mt-1 pl-5 text-sm italic text-gray-700">
                    Đáp án: <MathText text={q.modelAnswer || q.explanation} />
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        <p className="mt-6 text-center font-bold">----------- HẾT -----------</p>
      </div>

      <style jsx global>{`
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 16mm;
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.5;
          color: #000;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff;
          }
          .print-sheet {
            box-shadow: none;
            margin: 0;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
