import { supabaseAdmin } from '@/lib/supabase/client';
import { createNotification } from '@/lib/notify-server';

export type AddResult =
  | { student: { id: string; name: string; email: string; created: boolean } }
  | { error: string; status: number };

/**
 * Ghi danh học sinh (đã đăng ký tài khoản) vào lớp theo email.
 */
export async function addStudentToClass(
  classroomId: string,
  email: string,
): Promise<AddResult> {
  const cleanEmail = email.toLowerCase().trim();

  const user = (
    await supabaseAdmin
      .from('users')
      .select('id, name, full_name, email')
      .eq('email', cleanEmail)
      .maybeSingle()
  ).data;

  const created = false;

  // Chỉ thêm được học sinh ĐÃ ĐĂNG KÝ tài khoản.
  if (!user) {
    return {
      error: `Email "${cleanEmail}" chưa đăng ký tài khoản. Học sinh cần đăng ký trước rồi mới thêm vào lớp.`,
      status: 404,
    };
  }

  const { error: insErr } = await supabaseAdmin
    .from('classroom_students')
    .upsert(
      { classroom_id: classroomId, student_id: user.id },
      { onConflict: 'classroom_id,student_id', ignoreDuplicates: true }
    );

  if (insErr) return { error: insErr.message, status: 500 };

  // Thông báo cho học sinh được thêm vào lớp.
  const { data: cls } = await supabaseAdmin
    .from('classrooms')
    .select('name')
    .eq('id', classroomId)
    .single();
  await createNotification(user.id, {
    title: 'Bạn được thêm vào lớp',
    body: `Bạn đã được thêm vào lớp "${cls?.name || ''}". Hãy chờ giáo viên mở phòng thi.`,
    type: 'class',
    link: '/student/join-exam',
  });

  return {
    student: {
      id: user.id,
      name: user.full_name || user.name || fullName || 'Học sinh',
      email: user.email,
      created,
    },
  };
}
