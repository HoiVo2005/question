import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import {
  generateExamSets,
  saveExamSetsToDatabase,
  type ExamGenConfig,
} from '@/lib/ai-exam-generator';

export const maxDuration = 120; // sinh đề có thể mất thời gian

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      grade,
      subject,
      chapter,
      mcqCount,
      essayCount,
      durationMinutes,
      setCount,
      mcqPoints,
      essayPoints,
      department,
      school,
      title,
      schoolYear,
    } = body;

    // Validate
    const g = Number(grade);
    const mcq = Number(mcqCount) || 0;
    const essay = Number(essayCount) || 0;

    if (!g || g < 1 || g > 12) {
      return NextResponse.json({ error: 'Lớp phải từ 1 đến 12' }, { status: 400 });
    }
    if (!subject || !chapter) {
      return NextResponse.json(
        { error: 'Vui lòng nhập môn học và bài học/chương' },
        { status: 400 }
      );
    }
    if (mcq + essay <= 0) {
      return NextResponse.json(
        { error: 'Cần ít nhất 1 câu trắc nghiệm hoặc tự luận' },
        { status: 400 }
      );
    }
    if (mcq + essay > 60) {
      return NextResponse.json(
        { error: 'Tổng số câu tối đa là 60 (giới hạn để AI tạo chính xác)' },
        { status: 400 }
      );
    }

    const config: ExamGenConfig = {
      grade: g,
      subject: String(subject),
      chapter: String(chapter),
      mcqCount: mcq,
      essayCount: essay,
      durationMinutes: Number(durationMinutes) || 45,
      setCount: Math.min(Math.max(Number(setCount) || 1, 1), 8),
      mcqPoints: Number(mcqPoints) >= 0 ? Number(mcqPoints) : 6,
      essayPoints: Number(essayPoints) >= 0 ? Number(essayPoints) : 4,
      header: {
        department: department ? String(department) : undefined,
        school: school ? String(school) : undefined,
        title: title ? String(title) : undefined,
        schoolYear: schoolYear ? String(schoolYear) : undefined,
      },
    };

    const examSets = await generateExamSets(config);

    const result = await saveExamSetsToDatabase(
      config,
      examSets,
      session.user.id,
      null
    );

    return NextResponse.json({ examSets: result.examSets }, { status: 201 });
  } catch (error) {
    console.error('Generate exams error:', error);
    return NextResponse.json(
      { error: 'Lỗi tạo đề: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}