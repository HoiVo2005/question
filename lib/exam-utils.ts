import { db } from '@/db/client';
import { exams, questions, submissions, studentAnswers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export function generateExamCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function calculateScore(submissionId: string): Promise<{ total: number; max: number }> {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      answers: {
        with: {
          question: true,
        },
      },
    },
  });

  if (!submission) throw new Error('Submission not found');

  let total = 0;
  let max = 0;

  for (const answer of submission.answers) {
    const question = answer.question;
    max += question.points;

    if (question.type === 'mcq') {
      if (answer.isCorrect) {
        total += question.points;
      }
    } else {
      // Essay - only count if graded
      if (answer.earnedPoints !== null && answer.earnedPoints !== undefined) {
        total += answer.earnedPoints;
      }
    }
  }

  return { total, max };
}

export async function getGrade(percentage: number): Promise<string> {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

export async function findExamByCode(examCode: string) {
  return db.query.exams.findFirst({
    where: eq(exams.examCode, examCode),
    with: {
      questions: true,
    },
  });
}

export async function getExamStats(examId: string) {
  const result = await db
    .select({ count: count() })
    .from(submissions)
    .where(and(eq(submissions.examId, examId), eq(submissions.status, 'graded')));

  return result[0];
}
