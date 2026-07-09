# ExamHub Exam Upload Feature Guide

## Overview

The Exam Upload feature allows teachers to import existing exams (that they've created or received) into ExamHub without having to manually enter all questions. This is perfect for:

- Using legacy exam questions from previous years
- Importing exams created by colleagues
- Converting paper-based exams to digital format
- Using exam banks or published question collections

---

## Supported File Formats

### 1. Excel Format (.xlsx, .xls) - Recommended

**Advantages:**
- Easiest to edit and validate
- Fastest processing
- Best support for multiple exam sets
- Can include formatting and notes

**Required Columns:**

| Column | Vietnamese | English | Required | Example |
|--------|-----------|---------|----------|---------|
| Exam Code | Mã Đề | Set Code | Yes | A01, B02, C03 |
| Question Number | Câu | Question | Yes | 1, 2, 3, ... |
| Question Content | Nội Dung | Content | Yes | "What is 2+2?" |
| Option A | A | Option A | Yes | "3" |
| Option B | B | Option B | Yes | "4" |
| Option C | C | Option C | Yes | "5" |
| Option D | D | Option D | Yes | "6" |
| Type (Optional) | Loại | Type | No | "MCQ" or "Tự Luận" |

**Excel File Example:**

```
Mã Đề | Câu | Nội Dung | A | B | C | D | Loại
A01   | 1   | 2+2=?   | 3 | 4 | 5 | 6 | MCQ
A01   | 2   | 5-1=?   | 3 | 4 | 5 | 6 | MCQ
A01   | 3   | 10÷2=? | 3 | 4 | 5 | 6 | MCQ
B01   | 1   | 2+2=?   | 4 | 5 | 6 | 7 | MCQ
B01   | 2   | 5-1=?   | 4 | 5 | 6 | 7 | MCQ
B01   | 3   | 10÷2=? | 4 | 5 | 6 | 7 | MCQ
C01   | 1   | 2+2=?   | 5 | 6 | 7 | 8 | MCQ
C01   | 2   | 5-1=?   | 5 | 6 | 7 | 8 | MCQ
C01   | 3   | 10÷2=? | 5 | 6 | 7 | 8 | MCQ
```

### 2. Word Format (.docx, .doc)

**Advantages:**
- Familiar format for most teachers
- Can include rich formatting
- Good for complex question text

**Required Format:**

```
Mã Đề: A01

Câu 1: What is 2+2?
A) 3
B) 4
C) 5
D) 6

Câu 2: What is 5-1?
A) 3
B) 4
C) 5
D) 6

Mã Đề: B01

Câu 1: What is 2+2?
A) 4
B) 5
C) 6
D) 7
```

### 3. PDF Format (.pdf)

**Advantages:**
- Good for scanned or printed exams
- Preserves original formatting
- Read-only by default

**Required Format:**

Same as Word format above. PDF must have clearly structured text with:
- Exam code header
- Question numbers
- Options labeled A-D

---

## Step-by-Step Upload Process

### Step 1: Choose Upload Option

1. Go to **Tạo Phòng Kiểm Tra** (Create Exam Room)
2. Select **Upload Bộ Đề** (Upload Exam)
3. Click to proceed to upload form

### Step 2: Fill in Exam Details

1. **Tên Bộ Đề** (Exam Name): Enter exam name
   - Example: "Kiểm tra Giữa Kỳ Toán Lớp 10"
   - This will be displayed to students

2. **File Bộ Đề** (Exam File): Select file with questions
   - Supported: .xlsx, .docx, .pdf
   - Maximum: 10 MB
   - Must be properly formatted

3. **File Đáp Án** (Answer Key File): Select file with answers
   - Separate file from exam questions
   - Describes correct answer for each question

### Step 3: Upload Files

1. Click **Upload & Tiếp tục** (Upload & Continue)
2. System will process and validate files
3. If successful: Shows all recognized exam codes
4. If failed: Shows error message with details

### Step 4: Review Exam Sets

The system will display:
- Number of exam codes found
- Number of questions per set
- Exam name and subject

**Example:**
```
✓ Bộ Đề Được Upload
Kiểm tra Giữa Kỳ Toán
Được Upload

Mã Đề (3):
[A01] 25 câu
[B01] 25 câu
[C01] 25 câu
```

### Step 5: Select Exam Codes to Use

- Check boxes to select which exam codes
- Can use all or just some
- Must select at least 1

### Step 6: Configure Exam Room

1. Choose classroom
2. Set start time
3. Set end time
4. Click **Tạo Phòng Kiểm Tra** (Create Exam Room)

---

## Answer Key File Format

### Excel Format (Recommended)

**Required Columns:**

| Column | Vietnamese | English | Example |
|--------|-----------|---------|---------|
| Exam Code | Mã Đề | Set Code | A01 |
| Question 1 Answer | Câu 1 | Q1 | A |
| Question 2 Answer | Câu 2 | Q2 | B |
| Question 3 Answer | Câu 3 | Q3 | C |

**Excel Answer Key Example:**

```
Mã Đề | Câu 1 | Câu 2 | Câu 3 | Câu 4 | Câu 5
A01   | A     | B     | C     | D     | A
B01   | B     | C     | D     | A     | B
C01   | C     | D     | A     | B     | C
```

**Important:**
- Answers must be A, B, C, or D only
- No extra spaces or formatting
- One row per exam code
- Columns correspond to question order

### Word/PDF Format

```
Mã Đề A01:
Câu 1: A
Câu 2: B
Câu 3: C
Câu 4: D
Câu 5: A

Mã Đề B01:
Câu 1: B
Câu 2: C
Câu 3: D
Câu 4: A
Câu 5: B
```

---

## Common Issues & Solutions

### File Upload Fails

**Problem**: "Failed to parse file"

**Solutions:**
1. Check file format is supported (.xlsx, .docx, .pdf)
2. Ensure file is not corrupted
3. Check file size < 10 MB
4. Verify column names match format
5. Use Excel instead of Word or PDF

### Questions Not Recognized

**Problem**: "No questions found in file"

**Solutions:**
1. Verify format matches specification exactly
2. Check column headers are correct (Mã Đề, Câu, A, B, C, D)
3. Ensure questions are in correct cells
4. No empty rows between questions
5. Check for special characters or encoding issues

### Answer Key Mismatch

**Problem**: "Không thể xử lý đáp án" (Cannot process answer key)

**Solutions:**
1. Ensure exam codes in answer key match exam file (A01, B01, C01, etc.)
2. Check answers are only A, B, C, or D
3. No typos or extra spaces
4. Answer key file format correct
5. Number of answers ≥ number of questions

### Missing Exam Codes

**Problem**: "Không tìm thấy mã đề" (Exam code not found)

**Solutions:**
1. Ensure "Mã Đề" or "Set Code" column exists
2. Values must be codes like A01, B02, not full numbers
3. No empty cells in code column
4. Consistent format across file

---

## File Preparation Tips

### Creating Excel File in Excel/Calc

1. **Open spreadsheet application**
   - Microsoft Excel
   - Google Sheets
   - LibreOffice Calc

2. **Create header row** with exact names:
   ```
   Mã Đề | Câu | Nội Dung | A | B | C | D
   ```

3. **Fill in data** row by row:
   - Each row = one question
   - Don't skip rows
   - Keep data consistent

4. **Save as Excel format**
   - File → Save As
   - Choose "Excel Workbook (.xlsx)"
   - Don't save as CSV

5. **Review before uploading**
   - Check all columns have headers
   - Verify all cells filled
   - Check for typos

### Converting from Paper Exam

1. **Scan or photograph** exam paper
2. **Use OCR software** if available:
   - Adobe Acrobat
   - Google Docs OCR
   - Online OCR tools
3. **Edit extracted text** into Excel format
4. **Verify accuracy** after conversion

### Creating Word Document

1. Structure exactly as specified
2. Use clear numbering (Câu 1, Câu 2, ...)
3. Label options clearly (A), B), C), D))
4. Use consistent formatting
5. Save as .docx (modern Word format)

---

## Best Practices

### Before Uploading

✓ **Do:**
- Test file format with small sample first
- Verify all required columns present
- Check data for typos and errors
- Ensure answer key matches questions
- Keep exam codes consistent (A01, B01, C01)
- Use descriptive exam names

✗ **Don't:**
- Mix different languages in same file
- Skip questions (1, 3, 5 is wrong - should be 1, 2, 3)
- Use special characters in exam codes
- Include multiple answer key sheets
- Change file format during process

### File Size Recommendations

- Excel files: < 5 MB (usually 100KB-1MB)
- Word files: < 10 MB
- PDF files: < 10 MB

### Multiple Exam Sets Tips

- Keep exam codes similar format: A01, A02, ... or B01, B02, ...
- Each set should have same number of questions
- Don't mix question types (keep all MCQ or use consistent essay format)
- Answer key must have entry for each set

---

## After Upload

### What Happens

1. **System processes file:**
   - Extracts questions and metadata
   - Validates format and content
   - Creates question records in database
   - Generates answer key associations

2. **Exam sets created:**
   - One set per exam code found
   - Questions linked to correct set
   - Answer key linked to set
   - Ready for use in exam rooms

3. **Next steps:**
   - Select which exam codes to use
   - Configure exam room (time, classroom)
   - Publish for students

### Can I Edit After Upload?

**Yes!** You can:
- Modify individual questions
- Update answer key
- Change question order
- Delete specific questions
- Add more questions

**Via:** Teacher exam management page for the exam

### Can I Upload Another File?

**No, not directly.** To upload different exam:
1. Go to "Create Exam Room" again
2. Select "Upload Exam" option
3. Upload new file
4. Creates new exam set

---

## Troubleshooting Checklist

Before contacting support, verify:

- [ ] File format is supported (.xlsx, .docx, .pdf)
- [ ] File size under 10 MB
- [ ] Column headers exactly match specification
- [ ] All rows have complete data
- [ ] No empty rows between questions
- [ ] Exam codes consistent (A01, B01, not 1, 2)
- [ ] Answer key file has matching exam codes
- [ ] Answer key values are A, B, C, or D only
- [ ] No duplicate question numbers in same set
- [ ] Special characters properly encoded

---

## Examples

### Complete Excel Example

```
Mã Đề | Câu | Nội Dung | A | B | C | D | Loại
------|-----|----------|---|---|---|---|-----
A01   | 1   | 2+2=?   | 3 | 4 | 5 | 6 | MCQ
A01   | 2   | 5-1=?   | 3 | 4 | 5 | 6 | MCQ
A01   | 3   | 10÷2=?  | 3 | 4 | 5 | 6 | MCQ
B01   | 1   | 2+2=?   | 4 | 5 | 6 | 7 | MCQ
B01   | 2   | 5-1=?   | 4 | 5 | 6 | 7 | MCQ
B01   | 3   | 10÷2=?  | 4 | 5 | 6 | 7 | MCQ
```

### Complete Answer Key Example

```
Mã Đề | Câu 1 | Câu 2 | Câu 3
------|-------|-------|-------
A01   | B     | C     | A
B01   | A     | D     | B
```

---

## Quick Reference Card

**Upload Process:**
1. Click "Upload Bộ Đề"
2. Enter exam name
3. Select exam file (.xlsx, .docx, .pdf)
4. Select answer key file
5. Click Upload & Continue
6. Select exam codes
7. Choose classroom & time
8. Click Create

**File Requirements:**
- Format: Excel (.xlsx) recommended
- Columns: Mã Đề, Câu, Nội Dung, A, B, C, D
- Encoding: UTF-8
- Max size: 10 MB

**Validation:**
- All required columns present
- No empty questions
- Answer codes A-D only
- Matching exam codes in both files

---

## Support

For issues with uploading:
1. Check this guide's troubleshooting section
2. Verify file format and content
3. Try Excel format first
4. Contact admin with sample file if problem persists

**Success Tips:**
- Start with small test file (5-10 questions)
- Use Excel format for reliability
- Keep answer key separate and simple
- Follow exact column naming

---

**Version**: 1.0  
**Last Updated**: June 2, 2026  
**Feature Status**: Production Ready ✅
