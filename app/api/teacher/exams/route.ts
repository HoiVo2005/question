import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { exams, questions, submissions } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { generateExamCode } from '@/lib/exam-utils';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get from session
    const userId = request.headers.get('x-user-id') || 'demo-teacher';

    const teacherExams = await db.query.exams.findMany({
      where: eq(exams.teacherId, userId),
      with: {
        questions: true,
        submissions: true,
      },
    });

    const formattedExams = teacherExams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      examCode: exam.examCode,
      isPublished: exam.isPublished,
      duration: exam.duration,
      questionCount: exam.questions.length,
      submissionCount: exam.submissions.length,
      createdAt: exam.createdAt,
    }));

    return NextResponse.json({ exams: formattedExams });
  } catch (error) {
    console.error('Get exams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, duration, passingScore } = await request.json();

    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Title and duration are required' },
        { status: 400 }
      );
    }

    // TODO: Get from session
    const userId = request.headers.get('x-user-id') || 'demo-teacher';

    const examCode = generateExamCode();
    const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(exams).values({
      id: examId,
      teacherId: userId,
      title,
      description,
      duration,
      passingScore,
      examCode,
      isPublished: false,
    });

    return NextResponse.json({
      examId,
      examCode,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}
