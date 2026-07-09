import { supabaseAdmin } from './supabase/client';

export async function autoSubmitExpiredExams() {
  try {
    // Find all exam sets that have ended and have active submissions
    const { data: expiredExams, error: queryError } = await supabaseAdmin
      .from('exam_sets')
      .select('id, end_time')
      .lt('end_time', new Date().toISOString())
      .is('auto_submitted', false);

    if (queryError) {
      console.error('Error fetching expired exams:', queryError);
      return { success: false, error: queryError.message };
    }

    let submittedCount = 0;

    for (const exam of expiredExams || []) {
      // Get all active submissions for this exam
      const { data: activeSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('exam_set_id', exam.id)
        .eq('status', 'in_progress');

      // Auto-submit each active submission
      if (activeSubmissions) {
        for (const submission of activeSubmissions) {
          const { error: updateError } = await supabaseAdmin
            .from('submissions')
            .update({
              status: 'submitted',
              submitted_at: new Date().toISOString(),
            })
            .eq('id', submission.id);

          if (!updateError) {
            submittedCount++;
          }
        }
      }

      // Mark exam as auto-submitted
      await supabaseAdmin
        .from('exam_sets')
        .update({ auto_submitted: true })
        .eq('id', exam.id);
    }

    return {
      success: true,
      submittedCount,
      message: `Auto-submitted ${submittedCount} exams`,
    };
  } catch (error) {
    console.error('Auto-submit error:', error);
    return { success: false, error: String(error) };
  }
}

export async function triggerAutoGrading(submissionId: string) {
  try {
    // Get submission with answers
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        exam_sets(
          id,
          answer_keys(answers)
        ),
        student_answers(
          id,
          question_id,
          selected_option,
          earned_points
        )
      `
      )
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return { success: false, error: 'Submission not found' };
    }

    const answerKey = submission.exam_sets?.answer_keys?.[0]?.answers || {};
    let totalScore = 0;
    let essayCount = 0;

    // Calculate MCQ scores
    for (const answer of submission.student_answers || []) {
      if (answer.earned_points !== null) {
        // Already graded (MCQ)
        totalScore += answer.earned_points;
      } else {
        // Essay question - needs teacher grading
        essayCount++;
      }
    }

    // Update submission
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        total_score: totalScore,
        needs_essay_grading: essayCount > 0,
      })
      .eq('id', submissionId);

    return {
      success: !updateError,
      totalScore,
      essayCount,
    };
  } catch (error) {
    console.error('Auto-grading error:', error);
    return { success: false, error: String(error) };
  }
}
