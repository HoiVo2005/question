import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export async function parseExcelFile(
  buffer: Buffer
): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    return data.map((row: any) => ({
      setCode: row['Mã Đề'] || row['Set Code'] || 'DEFAULT',
      questionNumber: row['Câu'] || row['Question'] || row['No'],
      content: row['Nội Dung'] || row['Content'] || row['Question'],
      type: row['Loại'] === 'Tự Luận' ? 'essay' : 'mcq',
      optionA: row['A'] || row['Option A'],
      optionB: row['B'] || row['Option B'],
      optionC: row['C'] || row['Option C'],
      optionD: row['D'] || row['Option D'],
    }));
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

export async function parsePdfFile(buffer: Buffer): Promise<any[]> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data.text;

    // Parse PDF text - expects format like:
    // Mã Đề: A01
    // Câu 1: [Question text]
    // A) Option A
    // B) Option B
    // etc.

    const questions: any[] = [];
    const lines = text.split('\n').filter((l) => l.trim());

    let currentSetCode = 'DEFAULT';
    let currentQuestion: any = null;

    for (const line of lines) {
      if (line.includes('Mã Đề') || line.includes('Set Code')) {
        currentSetCode = line.split(':')[1]?.trim() || 'DEFAULT';
      } else if (line.match(/^Câu|^Question/)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          setCode: currentSetCode,
          questionNumber: parseInt(line.match(/\d+/)?.[0] || '0'),
          content: line.replace(/^Câu \d+:|^Question \d+:/, '').trim(),
          type: 'mcq',
        };
      } else if (line.match(/^[A-D]\)/)) {
        const option = line.charAt(0);
        const content = line.substring(2).trim();
        if (currentQuestion) {
          currentQuestion[`option${option}`] = content;
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}

export async function parseDocxFile(buffer: Buffer): Promise<any[]> {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Similar parsing logic to PDF
    const questions: any[] = [];
    const lines = text.split('\n').filter((l) => l.trim());

    let currentSetCode = 'DEFAULT';
    let currentQuestion: any = null;

    for (const line of lines) {
      if (line.includes('Mã Đề') || line.includes('Set Code')) {
        currentSetCode = line.split(':')[1]?.trim() || 'DEFAULT';
      } else if (line.match(/^Câu|^Question/)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          setCode: currentSetCode,
          questionNumber: parseInt(line.match(/\d+/)?.[0] || '0'),
          content: line.replace(/^Câu \d+:|^Question \d+:/, '').trim(),
          type: 'mcq',
        };
      } else if (line.match(/^[A-D]\)/)) {
        const option = line.charAt(0);
        const content = line.substring(2).trim();
        if (currentQuestion) {
          currentQuestion[`option${option}`] = content;
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  } catch (error) {
    console.error('Error parsing DOCX file:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export async function parseAnswerKeyFile(
  buffer: Buffer,
  fileType: string
): Promise<Record<string, Record<number, string>>> {
  try {
    let data: any[] = [];

    if (fileType === 'xlsx' || fileType === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(sheet);
    } else {
      // For PDF/DOCX, parse as simple text format
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter((l) => l.trim());
      data = lines.map((line) => {
        const [setCode, ...answers] = line.split(',').map((s) => s.trim());
        return { setCode, answers: answers.join(',') };
      });
    }

    // Transform into format: { setCode: { questionNumber: answer } }
    const result: Record<string, Record<number, string>> = {};

    for (const row of data) {
      const setCode = row['Mã Đề'] || row['Set Code'] || row.setCode;
      if (!setCode) continue;

      if (!result[setCode]) {
        result[setCode] = {};
      }

      // Get all columns that are answers (A, B, C, D, Câu 1, etc.)
      Object.keys(row).forEach((key) => {
        if (
          key.match(/^[A-D]$/) ||
          key.match(/^Câu \d+/) ||
          key.match(/^Question \d+/)
        ) {
          const questionNum = parseInt(key.match(/\d+/)?.[0] || '0') || 
            (key.length === 1 ? 1 : 0);
          const answer = row[key];
          if (answer) {
            result[setCode][questionNum] = answer;
          }
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Error parsing answer key file:', error);
    throw new Error('Failed to parse answer key file');
  }
}
