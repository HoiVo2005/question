import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string }> }
) {
    const params = await paramsPromise;
  try {
    const { examId } = params;

    const examSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.examId, examId),
      with: {
        student: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedSubmissions = examSubmissions.map((sub) => ({
      id: sub.id,
      student: {
        name: sub.student.name,
        email: sub.student.email,
      },
      status: sub.status,
      submittedAt: sub.submittedAt,
      totalScore: sub.totalScore,
      maxScore: sub.maxScore,
      grade: sub.grade,
    }));

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
