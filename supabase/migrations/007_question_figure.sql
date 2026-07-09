-- =============================================================================
-- Thêm trường figure (jsonb) cho câu hỏi: dữ liệu hình học để hệ thống vẽ SVG.
-- Cấu trúc: { points:[{name,x,y}], segments:[["A","B"]], circles:[{x,y,r}],
--            polygons:[["A","B","C"]] }  (toạ độ trong khoảng 0..10)
-- =============================================================================
alter table questions add column if not exists figure jsonb;
