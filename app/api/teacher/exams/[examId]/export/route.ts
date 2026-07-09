import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { getFullExamSet } from '@/lib/exam-data';
import { buildExamDocx, buildAnswerDocx } from '@/lib/exam-docx';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') === 'answer' ? 'answer' : 'exam';

    const exam = await getFullExamSet(examId);
    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy đề' }, { status: 404 });
    }

    // Chỉ người tạo mới được tải (nếu có thông tin người tạo).
    if (exam.createdBy && exam.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const buffer =
      type === 'answer' ? await buildAnswerDocx(exam) : await buildExamDocx(exam);

    const prefix = type === 'answer' ? 'dap-an' : 'de-thi';
    const filename = `${prefix}-${exam.setCode || exam.id}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': DOCX_MIME,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Lỗi xuất file: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}