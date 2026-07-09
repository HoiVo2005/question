import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { studentAnswers, submissions, questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateScore, getGrade } from '@/lib/exam-utils';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ submissionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const { submissionId } = params;
    const { answerId, earnedPoints, gradeComment } = await request.json();

    if (!answerId) {
      return NextResponse.json(
        { error: 'Answer ID is required' },
        { status: 400 }
      );
    }

    // Update student answer with grade
    await db
      .update(studentAnswers)
      .set({
        earnedPoints,
        gradeComment,
        updatedAt: new Date(),
      })
      .where(eq(studentAnswers.id, answerId));

    // Check if all questions are graded
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: {
        answers: {
          with: {
            question: true,
          },
        },
        exam: {
          with: {
            questions: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if all essay questions are graded
    const essayQuestions = submission.exam.questions.filter(
      (q: any) => q.type === 'essay'
    );
    const gradedEssays = submission.answers.filter(
      (a: any) =>
        essayQuestions.some((q: any) => q.id === a.questionId) &&
        a.earnedPoints !== null &&
        a.earnedPoints !== undefined
    );

    // Calculate total score
    let totalScore = 0;
    let maxScore = 0;

    for (const answer of submission.answers) {
      const question = submission.exam.questions.find(
        (q: any) => q.id === answer.questionId
      );
      if (question) {
        maxScore += question.points;
        if (answer.earnedPoints !== null && answer.earnedPoints !== undefined) {
          totalScore += answer.earnedPoints;
        }
      }
    }

    // If all questions are graded, update submission status
    if (gradedEssays.length === essayQuestions.length) {
      const percentage = (totalScore / maxScore) * 100;
      const grade = await getGrade(percentage);

      await db
        .update(submissions)
        .set({
          status: 'graded',
          totalScore,
          maxScore,
          grade,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId));
    } else {
      // Just update score
      await db
        .update(submissions)
        .set({
          totalScore,
          maxScore,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId));
    }

    return NextResponse.json({
      success: true,
      totalScore,
      maxScore,
      allGraded: gradedEssays.length === essayQuestions.length,
    });
  } catch (error) {
    console.error('Grade essay error:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
