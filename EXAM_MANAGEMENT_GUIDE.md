# Hướng Dẫn Quản Lý Phòng Thi và Bộ Đề

## Tổng Quan

ExamHub cung cấp hai cách để giáo viên tạo bộ đề thi:

1. **AI Tạo Bộ Đề** - Sử dụng trí tuệ nhân tạo để tự động tạo đề thi
2. **Upload Bộ Đề** - Tải lên bộ đề có sẵn từ máy tính

## 1. Tạo Phòng Thi

### Bước 1: Truy cập Trang Tạo Phòng Thi
- Từ bảng điều khiển giáo viên, nhấp vào **"Tạo Phòng Kiểm Tra"**
- Bạn sẽ được hỏi chọn nguồn bộ đề

### Bước 2: Chọn Nguồn Bộ Đề

#### Lựa Chọn A: Bộ Đề AI Tạo
1. Nhấp vào **"Bộ Đề AI Tạo"**
2. Điền thông tin:
   - **Môn Học**: Chọn từ danh sách (Toán, Vật Lý, Hóa, v.v.)
   - **Tên Bộ Đề**: Đặt tên cho bộ đề (VD: "Kiểm tra Giữa Kỳ")
   - **Số Câu Hỏi**: Chọn từ 5-100 câu
   - **Số Mã Đề**: Chọn từ 1-10 mã đề khác nhau
   - **Độ Khó**: Dễ / Trung Bình / Khó

3. Nhấp **"Tạo Bộ Đề"** để AI tạo các bộ đề

4. Khi hoàn tất:
   - Xem các mã đề đã tạo
   - Tải về đáp án (Excel file có thể in)
   - Chọn các mã đề bạn muốn sử dụng
   - Nhấp **"Tạo Phòng Kiểm Tra"**

#### Lựa Chọn B: Upload Bộ Đề
1. Nhấp vào **"Upload Bộ Đề"**
2. Điền thông tin:
   - **Tên Bộ Đề**: Đặt tên cho bộ đề
   - **File Bộ Đề**: Chọn file (Excel, Word, hoặc PDF)
   - **File Đáp Án**: Chọn file đáp án tương ứng

3. Định dạng File Bộ Đề (Excel):
   ```
   | Mã Đề | Câu | Nội Dung | A | B | C | D | Loại |
   |-------|-----|----------|---|---|---|---|------|
   | A01   | 1   | Câu hỏi? | X | Y | Z | W | MCQ  |
   | A01   | 2   | Câu hỏi? | X | Y | Z | W | MCQ  |
   | B01   | 1   | Câu hỏi? | X | Y | Z | W | MCQ  |
   ```

4. Định dạng File Đáp Án (Excel):
   ```
   | Mã Đề | Câu 1 | Câu 2 | Câu 3 | ... |
   |-------|-------|-------|-------|-----|
   | A01   | A     | B     | C     | ... |
   | B01   | B     | C     | A     | ... |
   ```

5. Nhấp **"Upload & Tiếp tục"** để xử lý file

6. Chọn các mã đề bạn muốn sử dụng và nhấp **"Tạo Phòng Kiểm Tra"**

### Bước 3: Cấu Hình Thời Gian

Sau khi chọn bộ đề:

1. **Chọn Lớp Học**: Chọn lớp để tạo phòng thi
2. **Thời Gian Bắt Đầu**: Khi nào học sinh được phép bắt đầu làm bài
3. **Thời Gian Kết Thúc**: Khi nào bài làm sẽ tự động nộp

### Bước 4: Hoàn Tất

- Nhấp **"Tạo Phòng Kiểm Tra"**
- Phòng thi được tạo thành công
- Bạn sẽ được chuyển đến trang quản lý phòng thi

## 2. Quản Lý Phòng Thi

### Các Tính Năng Chính

1. **Xem Danh Sách Học Sinh**
   - Xem học sinh nào đã tham gia phòng thi
   - Xem trạng thái bài làm (Chưa bắt đầu / Đang làm / Đã nộp)

2. **Kiểm Soát Thời Gian**
   - Cập nhật thời gian bắt đầu/kết thúc nếu cần
   - Hệ thống sẽ tự động nộp bài khi hết giờ

3. **Chấm Điểm**
   - MCQ: Tự động chấm theo đáp án
   - Tự Luận: Chấm thủ công bởi giáo viên

4. **Xuất Kết Quả**
   - Xuất danh sách điểm học sinh
   - Xuất chi tiết bài làm từng học sinh

## 3. Định Dạng File Chi Tiết

### File Bộ Đề Excel

**Tên Cột** (Có thể dùng tiếng Anh hoặc Tiếng Việt):
- `Mã Đề` hoặc `Set Code` - Mã đề (A01, B02, ...)
- `Câu` hoặc `Question` - Số thứ tự câu (1, 2, 3, ...)
- `Nội Dung` hoặc `Content` - Nội dung câu hỏi
- `A`, `B`, `C`, `D` - Các phương án trắc nghiệm
- `Loại` - Loại câu (MCQ hoặc Tự Luận)

**Ví dụ:**

```
Mã Đề | Câu | Nội Dung | A | B | C | D
A01   | 1   | 2+2=?   | 3 | 4 | 5 | 6
A01   | 2   | 5-1=?   | 3 | 4 | 5 | 6
B01   | 1   | 2+2=?   | 4 | 5 | 6 | 7
B01   | 2   | 5-1=?   | 4 | 5 | 6 | 7
```

### File Đáp Án Excel

**Tên Cột**:
- `Mã Đề` hoặc `Set Code` - Mã đề
- `Câu 1`, `Câu 2`, ... - Đáp án cho từng câu (A, B, C, hoặc D)

**Ví dụ:**

```
Mã Đề | Câu 1 | Câu 2 | Câu 3
A01   | B     | C     | A
B01   | A     | D     | B
C01   | C     | B     | D
```

### File PDF/Word

Cần có định dạng rõ ràng:

```
Mã Đề: A01

Câu 1: Nội dung câu hỏi?
A) Phương án A
B) Phương án B
C) Phương án C
D) Phương án D

Câu 2: Nội dung câu hỏi?
...
```

## 4. Tự Động Chấm Điểm

### MCQ (Trắc Nghiệm)
- Hệ thống tự động so sánh đáp án học sinh với đáp án chuẩn
- Mỗi câu đúng = 1 điểm
- Kết quả hiển thị ngay sau khi nộp bài

### Tự Luận
- Giáo viên chấm thủ công
- Có thể thêm ghi chú và giải thích
- Học sinh xem được điểm và phản hồi

## 5. Mẹo Sử Dụng

### Khi Sử Dụng AI Tạo Đề
- ✓ Chọn **3-5 mã đề** để học sinh không dễ chép nhau
- ✓ Tải về đáp án để in hoặc làm tài liệu
- ✓ Kiểm tra xem có câu hỏi nào không phù hợp không
- ✓ Có thể chỉnh sửa câu hỏi sau khi tạo

### Khi Upload Bộ Đề
- ✓ Kiểm tra kỹ file trước khi upload
- ✓ Đảm bảo mã đề trong file đề và đáp án **giống nhau**
- ✓ Sử dụng định dạng Excel để xử lý nhanh hơn
- ✓ Kiểm tra đáp án có đủ cho tất cả câu hỏi

### Về Thời Gian
- ✓ Đặt thời gian bắt đầu **trước 5-10 phút** để học sinh kịp chuẩn bị
- ✓ Để lại **5-10 phút** giữa thời gian kết thúc để học sinh nộp bài
- ✓ Nếu có sự cố, giáo viên có thể **kéo dài** thời gian

## 6. Khắc Phục Sự Cố

### File Không Upload Được
- Kiểm tra định dạng file (Excel, Word, PDF)
- Đảm bảo file không bị lỗi hoặc hỏng
- Kiểm tra dung lượng file (không quá 10MB)

### Đáp Án Không Khớp
- Đảm bảo mã đề trong file đề trùng với file đáp án
- Kiểm tra tên cột: phải là "Mã Đề" hoặc "Set Code"
- Kiểm tra đáp án chỉ là A, B, C, hoặc D

### Học Sinh Không Thể Vào Phòng Thi
- Kiểm tra thời gian bắt đầu (phải đã đến thời gian)
- Kiểm tra mã phòng thi học sinh nhập có đúng không
- Kiểm tra học sinh đã được thêm vào lớp học chưa

## 7. Hỗ Trợ Thêm

Nếu bạn gặp vấn đề, vui lòng:
1. Kiểm tra lại định dạng file
2. Đảm bảo kết nối internet ổn định
3. Thử tải lại trang web
4. Liên hệ với admin để được hỗ trợ
