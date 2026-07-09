import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { getFullExamSet } from '@/lib/exam-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examId } = await params;
    const exam = await getFullExamSet(examId);
    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy đề' }, { status: 404 });
    }
    if (exam.createdBy && exam.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Full exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}