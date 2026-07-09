-- =============================================================================
-- Chia điểm: phần trắc nghiệm & tự luận (vd TN 6đ, TL 4đ, tổng 10đ).
-- Cho phép điểm dạng số thực (vd 5.25/10).
-- An toàn chạy lại.
-- =============================================================================

alter table exam_sets add column if not exists mcq_points   real default 6;
alter table exam_sets add column if not exists essay_points real default 4;

-- Điểm dạng số thực để chấm theo thang 10.
alter table submissions  alter column total_score type real using total_score::real;
alter table submissions  alter column max_score   type real using max_score::real;
alter table questions     alter column points     type real using points::real;
alter table student_answers alter column earned_points type real using earned_points::real;
