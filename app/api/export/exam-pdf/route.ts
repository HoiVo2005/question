import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateExamPDF } from '@/lib/pdf-export';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        questions: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    const pdfBytes = await generateExamPDF(exam as any);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${exam.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
