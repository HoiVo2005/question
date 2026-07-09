import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { createNotification } from '@/lib/notify-server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = request.headers.get('X-Submission-ID');
    const formData = await request.formData();
    const answersStr = formData.get('answers') as string;
    const answers = JSON.parse(answersStr || '{}');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      );
    }

    // Get submission with exam questions and answer key
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        exam_sets(
          id,
          name,
          mcq_points,
          essay_points,
          questions(
            id,
            question_number,
            content,
            type,
            points
          ),
          answer_keys(answers)
        )
      `
      )
      .eq('id', submissionId)
      .eq('student_id', session.user.id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const examSet: any = submission.exam_sets;
    const answerKey = examSet.answer_keys?.[0]?.answers || {};
    const allQuestions: any[] = examSet.questions || [];
    const mcqQuestions = allQuestions.filter((q) => q.type === 'mcq');
    const essayQuestions = allQuestions.filter((q) => q.type === 'essay');

    const round2 = (n: number) => Math.round(n * 100) / 100;

    // Điểm theo TỪNG câu (giáo viên có thể đặt riêng cho mỗi câu).
    // Nếu câu chưa có điểm thì mặc định 1 điểm.
    const pointsOf = (q: any) => (q.points != null ? Number(q.points) : 1);

    // Tổng điểm tối đa = cộng điểm tất cả các câu của đề.
    const maxScore = round2(
      allQuestions.reduce((sum, q) => sum + pointsOf(q), 0)
    );

    let totalScore = 0;

    // Chấm trắc nghiệm tự động (theo tất cả câu mcq của đề)
    for (const q of mcqQuestions) {
      const selectedAnswer = answers[q.id] || null;
      const correctAnswer = answerKey[q.question_number];
      const isCorrect = !!selectedAnswer && selectedAnswer === correctAnswer;
      const earnedPoints = isCorrect ? pointsOf(q) : 0;
      totalScore += earnedPoints;

      await supabaseAdmin.from('student_answers').insert([
        {
          submission_id: submissionId,
          question_id: q.id,
          selected_option: selectedAnswer,
          is_correct: isCorrect,
          earned_points: round2(earnedPoints),
        },
      ]);
    }

    // Lưu bài tự luận (ảnh) — điểm do giáo viên chấm sau
    for (const q of essayQuestions) {
      const essayFile = formData.get(`essay_${q.id}`) as File | null;
      let fileUrl: string | null = null;

      if (essayFile) {
        const fileName = `${submissionId}/${q.id}/${essayFile.name}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('exam-submissions')
          .upload(fileName, essayFile);
        if (!uploadError && uploadData) {
          fileUrl = supabaseAdmin.storage
            .from('exam-submissions')
            .getPublicUrl(fileName).data.publicUrl;
        }
      }

      await supabaseAdmin.from('student_answers').insert([
        {
          submission_id: submissionId,
          question_id: q.id,
          essay_image_url: fileUrl,
          earned_points: null,
        },
      ]);
    }

    // Update submission status to submitted
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        // Không có câu tự luận -> chấm xong ngay; có tự luận -> chờ giáo viên chấm.
        status: essayQuestions.length === 0 ? 'graded' : 'submitted',
        submitted_at: new Date().toISOString(),
        total_score: round2(totalScore),
        max_score: maxScore,
      })
      .eq('id', submissionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Thông báo cho giáo viên: có học sinh nộp bài.
    try {
      const { data: sub } = await supabaseAdmin
        .from('submissions')
        .select('exam_room_id, exam_rooms(id, name, classrooms(teacher_id))')
        .eq('id', submissionId)
        .single();
      const room: any = sub?.exam_rooms;
      const teacherId = room?.classrooms?.teacher_id;
      if (teacherId) {
        await createNotification(teacherId, {
          title: 'Có học sinh nộp bài',
          body: `${session.user.name || 'Một học sinh'} đã nộp bài thi "${
            room?.name || ''
          }".`,
          type: 'submit',
          link: room?.id ? `/teacher/room/${room.id}` : undefined,
        });
      }
    } catch (e) {
      console.error('notify teacher error:', e);
    }

    return NextResponse.json(
      { resultId: submissionId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
