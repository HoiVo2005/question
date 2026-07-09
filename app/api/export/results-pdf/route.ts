import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateResultsPDF } from '@/lib/pdf-export';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

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

    // Only allow students/teachers to view their own results
    if (submission.status !== 'graded') {
      return NextResponse.json(
        { error: 'Results not available yet' },
        { status: 403 }
      );
    }

    const pdfBytes = await generateResultsPDF(
      submission.exam.title,
      submission.student.name || 'Student',
      submission.totalScore || 0,
      submission.maxScore || 0,
      submission.grade || 'Pending',
      submission.exam.questions,
      submission.answers
    );

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${submission.exam.title} - Results.pdf"`,
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
