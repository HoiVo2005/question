-- =============================================================================
-- Thông báo trong ứng dụng (in-app notifications).
-- =============================================================================
create table if not exists notifications (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  title      text not null,
  body       text,
  type       text default 'info',   -- info | success | class | submit | account | exam
  link       text,
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_notifications_created on notifications(created_at desc);

alter table notifications enable row level security;
