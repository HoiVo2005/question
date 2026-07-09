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
      .from('questions')
      .select('*')
      .eq('exam_set_id', params.examId)
      .order('question_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = data.map((item: any) => ({
      id: item.id,
      questionNumber: item.question_number,
      content: item.content,
      type: item.type,
    }));

    return NextResponse.json(transformed);
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

    // Verify exam belongs to teacher (same check as GET)
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

    const { content, type, questionNumber } = await request.json();

    if (!content || !type || !questionNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert([
        {
          exam_set_id: params.examId,
          question_number: questionNumber,
          content,
          type,
          created_at: new Date().toISOString(),
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
        questionNumber: data.question_number,
        content: data.content,
        type: data.type,
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
