'use client';

import { useState, useEffect } from 'react';
import { Exam, Question, StudentSubmission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExamQuestion } from './exam-question';
import { ExamTimer } from './exam-timer';
import { ExamProgress } from './exam-progress';

interface ExamContainerProps {
  exam: Exam;
  questions: Question[];
  submission: StudentSubmission;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
}

export function ExamContainer({ exam, questions, submission, onSubmit }: ExamContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60); // in seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(answers);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const answered = Object.keys(answers).length;
  const total = questions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-gray-600 text-sm">{exam.description}</p>
          </div>
          <div className="text-right">
            <ExamTimer timeLeft={timeLeft} duration={exam.duration} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <Card className="p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Question {currentIndex + 1} of {total}
                    </h2>
                    <span className="text-sm font-medium text-gray-600">
                      {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ExamProgress current={currentIndex + 1} total={total} />
                </div>

                <ExamQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                />

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </Button>

                  {currentIndex === total - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Submitting...' : 'Submit Exam'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-20">
              <h3 className="font-semibold mb-4">Questions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      idx === currentIndex
                        ? 'bg-blue-600 text-white'
                        : answers[q.id]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-sm">
                <p className="text-gray-600">
                  Answered: <span className="font-semibold">{answered}</span> of{' '}
                  <span className="font-semibold">{total}</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
