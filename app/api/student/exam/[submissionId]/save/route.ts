import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ submissionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    // Update submission with auto-save data
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({
        auto_saved_answers: answers,
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', params.submissionId)
      .eq('student_id', session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Answers saved' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
