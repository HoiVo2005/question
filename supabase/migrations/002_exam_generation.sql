-- =============================================================================
-- Bổ sung cột phục vụ tính năng "AI tạo đề thi" (lớp 1–12, ma trận mức độ,
-- header đề thi, câu trắc nghiệm + tự luận, lời giải chi tiết).
-- An toàn chạy lại nhiều lần (IF NOT EXISTS).
-- =============================================================================

-- exam_sets: thông tin đề & header
alter table exam_sets add column if not exists grade            integer;
alter table exam_sets add column if not exists chapter          text;     -- Bài học/Chương
alter table exam_sets add column if not exists duration_minutes integer;  -- Thời gian làm bài
alter table exam_sets add column if not exists mcq_count        integer default 0;
alter table exam_sets add column if not exists essay_count      integer default 0;
alter table exam_sets add column if not exists department       text;     -- Sở GD&ĐT
alter table exam_sets add column if not exists school           text;     -- Tên trường
alter table exam_sets add column if not exists title            text;     -- Tiêu đề đề thi
alter table exam_sets add column if not exists school_year      text;     -- Năm học

-- questions: mức độ tư duy + lời giải/đáp án mẫu
alter table questions add column if not exists cognitive_level text;       -- NB/TH/VD/VDC hoặc M1/M2/M3
alter table questions add column if not exists model_answer    text;       -- Đáp án/lời giải mẫu (tự luận)
alter table questions add column if not exists correct_answer  text;       -- (đã có ở schema chính, đảm bảo tồn tại)
alter table questions add column if not exists explanation     text;       -- (đã có ở schema chính, đảm bảo tồn tại)
alter table questions add column if not exists points          integer default 1;