import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// This endpoint is called periodically to auto-submit exams that have expired
export async function POST(request: NextRequest) {
  try {
    // Verify request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all in-progress submissions where end_time has passed
    const { data: submissions, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('id, exam_sets(id, name, end_time)')
      .eq('status', 'in_progress')
      .lt('exam_sets.end_time', now.toISOString());

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let submittedCount = 0;

    // Auto-submit each expired exam
    for (const submission of submissions || []) {
      const { error: updateError } = await supabaseAdmin
        .from('submissions')
        .update({
          status: 'submitted',
          submitted_at: now.toISOString(),
        })
        .eq('id', submission.id);

      if (!updateError) {
        submittedCount++;
      }
    }

    return NextResponse.json({
      message: 'Auto-submit job completed',
      submittedCount,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Auto-submit job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
