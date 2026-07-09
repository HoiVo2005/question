'use client';

import { useState } from 'react';
import { Question, MCQOption } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExamQuestionProps {
  question: Question;
  answer?: any;
  onAnswerChange: (answer: any) => void;
}

export function ExamQuestion({ question, answer, onAnswerChange }: ExamQuestionProps) {
  const [essayImage, setEssayImage] = useState<File | null>(null);

  if (question.type === 'mcq') {
    return (
      <div className="space-y-6">
        {question.questionImage && (
          <img
            src={question.questionImage}
            alt="Question"
            className="max-w-full h-auto rounded"
          />
        )}

        <p className="text-lg">{question.questionText}</p>

        <div className="space-y-3">
          {question.options?.map((option: MCQOption) => (
            <label
              key={option.label}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                answer === option.label
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.label}
                checked={answer === option.label}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-gray-700">{option.text}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'essay') {
    return (
      <div className="space-y-6">
        {question.questionImage && (
          <img
            src={question.questionImage}
            alt="Question"
            className="max-w-full h-auto rounded"
          />
        )}

        <p className="text-lg">{question.questionText}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Answer (Image)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              {essayImage ? (
                <div className="space-y-3">
                  <img
                    src={URL.createObjectURL(essayImage)}
                    alt="Your answer"
                    className="max-w-full h-auto rounded max-h-64"
                  />
                  <div className="text-sm text-gray-600">
                    <p>File: {essayImage.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEssayImage(null)}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEssayImage(file);
                        onAnswerChange(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
            <textarea
              value={answer?.text || ''}
              onChange={(e) =>
                onAnswerChange({
                  ...answer,
                  text: e.target.value,
                })
              }
              placeholder="Add any text notes to accompany your image..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
