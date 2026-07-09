import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ submissionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get submission with all grading details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        submitted_at,
        total_score,
        max_score,
        users(full_name),
        exam_sets(
          name,
          classrooms(name, teacher_id),
          questions(
            id,
            question_number,
            content,
            type
          ),
          answer_keys(answers)
        ),
        student_answers(
          question_id,
          selected_option,
          is_correct,
          earned_points,
          essay_image_url
        )
      `
      )
      .eq('id', params.submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Verify teacher ownership
    if (submission.exam_sets.classrooms.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examSet = submission.exam_sets;
    const answerKey = examSet.answer_keys?.[0]?.answers || {};

    // Transform questions with student answers
    const questions = examSet.questions.map((question: any) => {
      const studentAnswer = submission.student_answers.find(
        (a: any) => a.question_id === question.id
      );

      const q: any = {
        id: question.id,
        questionNumber: question.question_number,
        content: question.content,
        type: question.type,
      };

      if (question.type === 'mcq') {
        q.correctAnswer = answerKey[question.question_number];
        q.selectedAnswer = studentAnswer?.selected_option;
        q.isCorrect = studentAnswer?.is_correct;
      } else {
        q.essayImageUrl = studentAnswer?.essay_image_url;
        q.earnedPoints = studentAnswer?.earned_points;
      }

      return q;
    });

    const mcqQuestions = questions.filter((q: any) => q.type === 'mcq');
    const mcqScore = mcqQuestions.reduce(
      (sum: number, q: any) => sum + (q.isCorrect ? 1 : 0),
      0
    );

    return NextResponse.json({
      studentName: submission.users.full_name,
      examName: examSet.name,
      classroomName: examSet.classrooms.name,
      mcqScore,
      maxMcqScore: mcqQuestions.length,
      questions,
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
  { params: paramsPromise }: { params: Promise<{ submissionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { essayScores } = await request.json();

    if (!essayScores || typeof essayScores !== 'object') {
      return NextResponse.json(
        { error: 'Invalid essay scores format' },
        { status: 400 }
      );
    }

    // Get submission to verify ownership
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select('exam_sets(classrooms(teacher_id))')
      .eq('id', params.submissionId)
      .single();

    if (!submission || submission.exam_sets.classrooms.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update essay scores
    for (const questionId in essayScores) {
      const points = essayScores[questionId];

      await supabaseAdmin
        .from('student_answers')
        .update({ earned_points: points })
        .eq('submission_id', params.submissionId)
        .eq('question_id', questionId);
    }

    // Get all answers to calculate final score
    const { data: allAnswers } = await supabaseAdmin
      .from('student_answers')
      .select('earned_points')
      .eq('submission_id', params.submissionId);

    const finalScore = allAnswers.reduce(
      (sum: number, answer: any) => sum + (answer.earned_points || 0),
      0
    );

    // Update submission as graded
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'graded',
        total_score: finalScore,
      })
      .eq('id', params.submissionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Grades submitted' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
