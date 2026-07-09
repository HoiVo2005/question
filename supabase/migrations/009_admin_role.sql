-- =============================================================================
-- Bổ sung vai trò 'admin' vào ràng buộc role của bảng users.
-- =============================================================================
alter table users drop constraint if exists users_role_check;
alter table users
  add constraint users_role_check
  check (role = any (array['teacher'::text, 'student'::text, 'admin'::text]));
