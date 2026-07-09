import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// This endpoint automatically grades MCQ questions based on answer keys
export async function POST(request: NextRequest) {
  try {
    // Verify request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all submitted exams that haven't been graded yet
    const { data: submissions, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        exam_sets(
          id,
          questions(
            id,
            question_number,
            type
          ),
          answer_keys(answers)
        ),
        student_answers(
          id,
          question_id,
          selected_option,
          is_correct
        )
      `
      )
      .eq('status', 'submitted');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let gradedCount = 0;

    // Auto-grade MCQ answers
    for (const submission of submissions || []) {
      const examSet = submission.exam_sets;
      const answerKey = examSet.answer_keys?.[0]?.answers || {};

      let totalScore = 0;
      let maxScore = 0;
      let hasEssays = false;

      // Grade MCQ questions
      for (const question of examSet.questions) {
        if (question.type === 'mcq') {
          maxScore += 1;

          const studentAnswer = submission.student_answers.find(
            (a: any) => a.question_id === question.id
          );

          if (studentAnswer && !studentAnswer.is_correct) {
            const correctAnswer = answerKey[question.question_number];
            const isCorrect = studentAnswer.selected_option === correctAnswer;

            if (isCorrect) {
              // Update answer as correct
              await supabaseAdmin
                .from('student_answers')
                .update({
                  is_correct: true,
                  earned_points: 1,
                })
                .eq('id', studentAnswer.id);

              totalScore += 1;
            }
          } else if (studentAnswer?.is_correct) {
            totalScore += 1;
          }
        } else if (question.type === 'essay') {
          hasEssays = true;
          maxScore += 1;
        }
      }

      // Update submission with grading info
      const newStatus = hasEssays ? 'submitted' : 'graded';

      const { error: updateError } = await supabaseAdmin
        .from('submissions')
        .update({
          total_score: totalScore,
          max_score: maxScore,
          status: newStatus,
        })
        .eq('id', submission.id);

      if (!updateError) {
        gradedCount++;
      }
    }

    return NextResponse.json({
      message: 'Auto-grade job completed',
      gradedCount,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auto-grade job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
