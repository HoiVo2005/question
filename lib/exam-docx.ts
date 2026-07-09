import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
} from 'docx';
import type { FullExam, FullExamQuestion } from './exam-data';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

function center(children: TextRun[]): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, children });
}
function bold(text: string, size = 24): TextRun {
  return new TextRun({ text, bold: true, size });
}
function normal(text: string, size = 24): TextRun {
  return new TextRun({ text, size });
}

/** Bảng header 2 cột giống đề thi thật. */
function headerTable(exam: FullExam): Table {
  const left: Paragraph[] = [
    center([bold((exam.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase())]),
    center([bold((exam.school || '').toUpperCase())]),
    center([new TextRun({ text: '--------------------', size: 22 })]),
  ];

  const right: Paragraph[] = [
    center([bold((exam.title || 'ĐỀ KIỂM TRA').toUpperCase())]),
    center([bold(`NĂM HỌC ${exam.schoolYear || ''}`.trim())]),
    center([bold(`MÔN: ${(exam.subject || '').toUpperCase()}`)]),
    center([
      new TextRun({
        text: `Thời gian làm bài: ${exam.durationMinutes || 45} phút`,
        italics: true,
        size: 24,
      }),
    ]),
    center([
      new TextRun({ text: '(không kể thời gian phát đề)', italics: true, size: 22 }),
    ]),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    columnWidths: [4500, 4500],
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: NO_BORDERS, width: { size: 50, type: WidthType.PERCENTAGE }, children: left }),
          new TableCell({ borders: NO_BORDERS, width: { size: 50, type: WidthType.PERCENTAGE }, children: right }),
        ],
      }),
    ],
  });
}

function candidateLine(exam: FullExam): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    children: [
      normal('Họ và tên thí sinh: ........................................................   '),
      normal('Số báo danh: ...................   '),
      bold(`Mã đề: ${exam.setCode || ''}`),
    ],
  });
}

function questionParagraphs(q: FullExamQuestion, showAnswer: boolean): Paragraph[] {
  const out: Paragraph[] = [];
  const head = `Câu ${q.questionNumber}${
    q.type === 'essay' && q.points ? ` (${q.points} điểm)` : ''
  }: `;
  out.push(
    new Paragraph({
      spacing: { before: 120 },
      children: [bold(head), normal(q.content)],
    })
  );

  if (q.type === 'mcq' && q.options) {
    (['A', 'B', 'C', 'D'] as const).forEach((k) => {
      const isCorrect = showAnswer && q.correctAnswer === k;
      out.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${k}. `, bold: true, size: 24 }),
            new TextRun({
              text: q.options![k],
              size: 24,
              bold: isCorrect,
              color: isCorrect ? '1B7F2A' : undefined,
            }),
          ],
        })
      );
    });
  } else if (q.type === 'essay' && !showAnswer) {
    // chừa khoảng trống làm bài
    out.push(new Paragraph({ children: [normal('')] }));
  }

  return out;
}

/** Đề thi (không có đáp án). */
export async function buildExamDocx(exam: FullExam): Promise<Buffer> {
  const mcq = exam.questions.filter((q) => q.type === 'mcq');
  const essay = exam.questions.filter((q) => q.type === 'essay');

  const children: (Paragraph | Table)[] = [headerTable(exam), candidateLine(exam)];

  if (mcq.length) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [bold('PHẦN I. TRẮC NGHIỆM', 26)],
      })
    );
    mcq.forEach((q) => children.push(...questionParagraphs(q, false)));
  }

  if (essay.length) {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [bold('PHẦN II. TỰ LUẬN', 26)],
      })
    );
    essay.forEach((q) => children.push(...questionParagraphs(q, false)));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [new TextRun({ text: '----------- HẾT -----------', bold: true, size: 24 })],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

/** File đáp án + hướng dẫn chấm chi tiết. */
export async function buildAnswerDocx(exam: FullExam): Promise<Buffer> {
  const mcq = exam.questions.filter((q) => q.type === 'mcq');
  const essay = exam.questions.filter((q) => q.type === 'essay');

  const children: (Paragraph | Table)[] = [
    center([bold('ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM', 28)]),
    center([
      bold(
        `${(exam.title || exam.subject || '').toUpperCase()} · LỚP ${exam.grade ?? ''} · MÃ ĐỀ ${exam.setCode || ''}`,
        22
      ),
    ]),
  ];

  // Bảng đáp án trắc nghiệm (chia nhóm 10 câu/dòng).
  if (mcq.length) {
    children.push(
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [bold('I. ĐÁP ÁN TRẮC NGHIỆM', 24)] })
    );
    const chunkSize = 10;
    for (let i = 0; i < mcq.length; i += chunkSize) {
      const chunk = mcq.slice(i, i + chunkSize);
      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
      const borders = {
        top: cellBorder,
        bottom: cellBorder,
        left: cellBorder,
        right: cellBorder,
      };
      const numRow = new TableRow({
        children: [
          new TableCell({ borders, children: [center([bold('Câu', 20)])] }),
          ...chunk.map(
            (q) =>
              new TableCell({ borders, children: [center([bold(String(q.questionNumber), 20)])] })
          ),
        ],
      });
      const ansRow = new TableRow({
        children: [
          new TableCell({ borders, children: [center([bold('Đáp án', 20)])] }),
          ...chunk.map(
            (q) =>
              new TableCell({
                borders,
                children: [center([normal(q.correctAnswer || '-', 20)])],
              })
          ),
        ],
      });
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [numRow, ansRow],
        })
      );
      children.push(new Paragraph({ children: [normal('')] }));
    }
  }

  // Hướng dẫn chi tiết
  children.push(
    new Paragraph({ spacing: { before: 200, after: 80 }, children: [bold('II. HƯỚNG DẪN CHI TIẾT', 24)] })
  );

  exam.questions.forEach((q) => {
    const head =
      q.type === 'mcq'
        ? `Câu ${q.questionNumber}. Đáp án ${q.correctAnswer || '-'}. `
        : `Câu ${q.questionNumber}${q.points ? ` (${q.points} điểm)` : ''}. `;
    children.push(
      new Paragraph({ spacing: { before: 120 }, children: [bold(head), normal(q.content)] })
    );
    const detail = q.type === 'essay' ? q.modelAnswer || q.explanation : q.explanation;
    if (detail) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: detail, italics: true, size: 24 })],
        })
      );
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}