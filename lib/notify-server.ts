import { supabaseAdmin } from '@/lib/supabase/client';

export type NotiType =
  | 'info'
  | 'success'
  | 'class'
  | 'submit'
  | 'account'
  | 'exam';

interface NotiInput {
  title: string;
  body?: string;
  type?: NotiType;
  link?: string;
}

/** Tạo thông báo cho 1 người dùng. */
export async function createNotification(userId: string, n: NotiInput) {
  if (!userId) return;
  try {
    await supabaseAdmin.from('notifications').insert([
      {
        user_id: userId,
        title: n.title,
        body: n.body ?? null,
        type: n.type ?? 'info',
        link: n.link ?? null,
      },
    ]);
  } catch (e) {
    console.error('createNotification error:', e);
  }
}

/** Tạo cùng một thông báo cho nhiều người dùng. */
export async function createNotifications(userIds: string[], n: NotiInput) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return;
  try {
    await supabaseAdmin.from('notifications').insert(
      ids.map((user_id) => ({
        user_id,
        title: n.title,
        body: n.body ?? null,
        type: n.type ?? 'info',
        link: n.link ?? null,
      }))
    );
  } catch (e) {
    console.error('createNotifications error:', e);
  }
}
