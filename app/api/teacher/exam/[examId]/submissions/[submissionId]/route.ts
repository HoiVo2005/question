import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { submissions, studentAnswers, questions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string; submissionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const { submissionId } = params;

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: {
        exam: {
          with: {
            questions: true,
          },
        },
        answers: true,
        student: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const maxScore = submission.exam.questions.reduce(
      (sum: number, q: any) => sum + q.points,
      0
    );

    return NextResponse.json({
      questions: submission.exam.questions,
      answers: submission.answers,
      studentName: submission.student.name,
      maxScore,
      submissionStatus: submission.status,
    });
  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}
