import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { Exam, Question, StudentAnswer } from './types';

export async function generateExamPDF(
  exam: Exam & { questions: Question[] }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // 8.5" x 11"
  let yPosition = 750;
  const margin = 50;
  const pageWidth = 612 - 2 * margin;

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to add text with wrapping
  const addText = (
    text: string,
    size: number,
    bold: boolean = false,
    space: number = 10
  ) => {
    const font = bold ? helveticaBold : helvetica;
    const lines = text.split('\n');

    for (const line of lines) {
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, size);

        if (width > pageWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition -= space;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= space;
      }
    }
  };

  const checkNewPage = () => {
    if (yPosition < 100) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }
  };

  // Title
  addText(exam.title, 18, true, 15);
  checkNewPage();

  // Exam Info
  addText(`Duration: ${exam.duration} minutes`, 10);
  addText(`Passing Score: ${exam.passingScore}%`, 10);
  addText(`Exam Code: ${exam.examCode}`, 10);
  yPosition -= 10;
  checkNewPage();

  if (exam.description) {
    addText(`Instructions: ${exam.description}`, 10);
    yPosition -= 10;
    checkNewPage();
  }

  // Questions
  exam.questions.forEach((question, index) => {
    checkNewPage();

    // Question Number
    addText(`Question ${index + 1} (${question.points} points)`, 12, true);
    checkNewPage();

    // Question Text
    addText(question.questionText, 11);
    yPosition -= 5;
    checkNewPage();

    if (question.type === 'mcq' && question.options) {
      // MCQ Options
      question.options.forEach((option) => {
        addText(`${option.label}) ${option.text}`, 10);
        checkNewPage();
      });

      yPosition -= 5;
      checkNewPage();

      // Correct Answer (for answer key)
      addText(
        `Correct Answer: ${question.correctAnswer}${question.explanation ? ' (' + question.explanation + ')' : ''}`,
        10,
        true
      );
      checkNewPage();
    } else if (question.type === 'essay') {
      addText('[Essay Question - Student to provide written response]', 10);
      checkNewPage();
    }

    yPosition -= 15;
  });

  return pdfDoc.save();
}

export async function generateResultsPDF(
  examTitle: string,
  studentName: string,
  totalScore: number,
  maxScore: number,
  grade: string,
  questions: Question[],
  answers: StudentAnswer[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]);
  let yPosition = 750;
  const margin = 50;
  const pageWidth = 612 - 2 * margin;

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const addText = (
    text: string,
    size: number,
    bold: boolean = false,
    space: number = 10
  ) => {
    const font = bold ? helveticaBold : helvetica;
    const lines = text.split('\n');

    for (const line of lines) {
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, size);

        if (width > pageWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size,
            font,
          });
          yPosition -= space;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size,
          font,
        });
        yPosition -= space;
      }
    }
  };

  const checkNewPage = () => {
    if (yPosition < 100) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }
  };

  // Header
  addText('EXAM RESULTS REPORT', 18, true, 15);
  checkNewPage();

  addText(`Exam: ${examTitle}`, 12, true);
  addText(`Student: ${studentName}`, 12, false);
  addText(`Grade: ${grade}`, 12, true);
  addText(`Score: ${totalScore}/${maxScore} (${((totalScore / maxScore) * 100).toFixed(1)}%)`, 12, false);
  yPosition -= 15;
  checkNewPage();

  // Answer Summary
  addText('ANSWER SUMMARY', 14, true, 12);
  checkNewPage();

  questions.forEach((question, index) => {
    const answer = answers.find((a) => a.questionId === question.id);
    checkNewPage();

    addText(`Q${index + 1}: ${question.questionText}`, 11, true);
    checkNewPage();

    if (question.type === 'mcq') {
      addText(`Your Answer: ${answer?.selectedOption || 'Not answered'}`, 10);
      addText(`Correct Answer: ${question.correctAnswer}`, 10);
      addText(`Result: ${answer?.isCorrect ? 'CORRECT' : 'INCORRECT'}`, 10, true);
      if (answer?.earnedPoints !== undefined) {
        addText(`Points: ${answer.earnedPoints}/${question.points}`, 10);
      }
    } else {
      addText(`[Essay Question]`, 10);
      if (answer?.earnedPoints !== undefined) {
        addText(`Points Earned: ${answer.earnedPoints}/${question.points}`, 10);
      }
      if (answer?.gradeComment) {
        addText(`Teacher Comment: ${answer.gradeComment}`, 10);
      }
    }

    yPosition -= 10;
  });

  return pdfDoc.save();
}
