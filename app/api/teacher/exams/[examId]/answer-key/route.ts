import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam belongs to teacher
    const { data: exam } = await supabaseAdmin
      .from('exam_sets')
      .select('classroom_id')
      .eq('id', params.examId)
      .single();

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', exam.classroom_id)
      .single();

    if (classroom?.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('answer_keys')
      .select('*')
      .eq('exam_set_id', params.examId)
      .single();

    if (error) {
      return NextResponse.json({ answers: {} });
    }

    return NextResponse.json({
      id: data.id,
      answers: data.answers,
      fileName: data.file_name,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam belongs to teacher
    const { data: exam } = await supabaseAdmin
      .from('exam_sets')
      .select('classroom_id')
      .eq('id', params.examId)
      .single();

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', exam.classroom_id)
      .single();

    if (classroom?.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers, fileName } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answer key format' },
        { status: 400 }
      );
    }

    // Delete existing answer key if exists
    await supabaseAdmin
      .from('answer_keys')
      .delete()
      .eq('exam_set_id', params.examId);

    // Insert new answer key
    const { data, error } = await supabaseAdmin
      .from('answer_keys')
      .insert([
        {
          exam_set_id: params.examId,
          answers,
          file_name: fileName,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: data.id,
        answers: data.answers,
        fileName: data.file_name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
