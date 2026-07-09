import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ classroomId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom belongs to teacher
    const { data: classroom, error: classError } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('id', params.classroomId)
      .eq('teacher_id', session.user.id)
      .single();

    if (classError || !classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('exam_sets')
      .select(
        `
        id,
        name,
        set_code,
        created_at,
        questions(id),
        answer_keys(id)
      `
      )
      .eq('classroom_id', params.classroomId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      setCode: item.set_code,
      questionCount: item.questions?.length || 0,
      hasAnswerKey: (item.answer_keys?.length || 0) > 0,
      createdAt: item.created_at,
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
  { params: paramsPromise }: { params: Promise<{ classroomId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom belongs to teacher
    const { data: classroom, error: classError } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('id', params.classroomId)
      .eq('teacher_id', session.user.id)
      .single();

    if (classError || !classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const { name, setCode } = await request.json();

    if (!name || !setCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('exam_sets')
      .insert([
        {
          classroom_id: params.classroomId,
          name,
          set_code: setCode,
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
        name: data.name,
        setCode: data.set_code,
        createdAt: data.created_at,
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
