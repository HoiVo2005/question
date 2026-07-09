-- =============================================================================
-- Thêm khóa ngoại submissions.exam_room_id -> exam_rooms(id)
-- để cho phép truy vấn lồng (PostgREST embed) giữa submissions và exam_rooms.
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'submissions_exam_room_id_fkey'
  ) then
    alter table submissions
      add constraint submissions_exam_room_id_fkey
      foreign key (exam_room_id) references exam_rooms(id) on delete set null;
  end if;
end $$;
