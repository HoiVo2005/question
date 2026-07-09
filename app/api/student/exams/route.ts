import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get from session
    const userId = request.headers.get('x-user-id') || 'demo-student';

    const studentSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.studentId, userId),
      with: {
        exam: true,
      },
    });

    const formattedExams = studentSubmissions.map((sub) => ({
      id: sub.id,
      examId: sub.examId,
      exam: {
        title: sub.exam.title,
        description: sub.exam.description,
      },
      status: sub.status,
      startedAt: sub.startedAt,
      submittedAt: sub.submittedAt,
      totalScore: sub.totalScore,
      maxScore: sub.maxScore,
      grade: sub.grade,
    }));

    return NextResponse.json({ exams: formattedExams });
  } catch (error) {
    console.error('Get student exams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
