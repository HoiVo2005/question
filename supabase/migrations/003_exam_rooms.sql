-- =============================================================================
-- Phòng thi (exam_rooms): mỗi lớp có thể tạo nhiều phòng thi.
-- Mỗi phòng có mã phòng, khoảng thời gian, và pool mã đề để gán NGẪU NHIÊN.
-- Học sinh vào thi bằng MÃ LỚP; hệ thống tự chọn phòng đang mở + đề ngẫu nhiên.
-- An toàn chạy lại (IF NOT EXISTS).
-- =============================================================================

create table if not exists exam_rooms (
  id            text primary key default gen_random_uuid()::text,
  classroom_id  text references classrooms(id) on delete cascade,
  name          text,
  room_code     text unique,
  exam_set_ids  jsonb default '[]'::jsonb,  -- pool mã đề (exam_sets.id) để random
  start_time    timestamptz,
  end_time      timestamptz,
  created_by    text references users(id) on delete set null,
  created_at    timestamptz default now()
);

create index if not exists idx_exam_rooms_classroom on exam_rooms(classroom_id);

alter table exam_rooms enable row level security;

-- Liên kết bài nộp với phòng thi (để học sinh nối lại đúng phòng).
alter table submissions add column if not exists exam_room_id text;
create index if not exists idx_submissions_room on submissions(exam_room_id);
