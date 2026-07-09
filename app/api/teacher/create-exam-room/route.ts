import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, examName, setCodes, startTime, endTime, classroomId } =
      await request.json();

    if (!classroomId || !setCodes || setCodes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create main exam room
    const { data: examRoom, error: roomError } = await supabaseAdmin
      .from('exam_sets')
      .insert([
        {
          classroom_id: classroomId,
          name: examName,
          subject,
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          is_exam_room: true,
          question_count: 0, // Will be aggregated from sets
        },
      ])
      .select('id')
      .single();

    if (roomError || !examRoom) {
      return NextResponse.json(
        { error: 'Failed to create exam room' },
        { status: 500 }
      );
    }

    // Link selected exam sets to this room
    const { error: linkError } = await supabaseAdmin
      .from('exam_room_sets')
      .insert(
        setCodes.map((setCode: string) => ({
          exam_room_id: examRoom.id,
          set_code: setCode,
        }))
      );

    if (linkError) {
      console.error('Link error:', linkError);
      // Continue anyway - room was created
    }

    return NextResponse.json(
      { 
        examRoomId: examRoom.id,
        message: 'Phòng kiểm tra được tạo thành công'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + String(error) },
      { status: 500 }
    );
  }
}
