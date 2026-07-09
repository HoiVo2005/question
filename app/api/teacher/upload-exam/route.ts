import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { parseExcelFile, parsePdfFile, parseDocxFile } from '@/lib/file-processing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const answerKeyFile = formData.get('answerKeyFile') as File;
    const examName = formData.get('examName') as string;

    if (!file || !answerKeyFile || !examName) {
      return NextResponse.json(
        { error: 'Missing required files or exam name' },
        { status: 400 }
      );
    }

    // Parse exam file
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let questions: any[] = [];

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      questions = await parseExcelFile(buffer);
    } else if (fileExtension === 'pdf') {
      questions = await parsePdfFile(buffer);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      questions = await parseDocxFile(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in file' },
        { status: 400 }
      );
    }

    // Parse answer key file
    const answerKeyBuffer = Buffer.from(
      await answerKeyFile.arrayBuffer()
    );
    const answerKeyExtension = answerKeyFile.name
      .split('.')
      .pop()
      ?.toLowerCase();

    let answerKeys: Record<string, any> = {};

    if (
      answerKeyExtension === 'xlsx' ||
      answerKeyExtension === 'xls'
    ) {
      answerKeys = await parseExcelFile(answerKeyBuffer);
    } else if (answerKeyExtension === 'pdf') {
      answerKeys = await parsePdfFile(answerKeyBuffer);
    } else if (
      answerKeyExtension === 'docx' ||
      answerKeyExtension === 'doc'
    ) {
      answerKeys = await parseDocxFile(answerKeyBuffer);
    }

    // Group questions by exam set code (A01, B01, etc.)
    const setMap = new Map<string, any[]>();
    let setCodeList: string[] = [];

    questions.forEach((q: any) => {
      const setCode = q.setCode || 'DEFAULT';
      if (!setMap.has(setCode)) {
        setMap.set(setCode, []);
        setCodeList.push(setCode);
      }
      setMap.get(setCode)!.push(q);
    });

    // Validate we have at least one exam set
    if (setMap.size === 0) {
      return NextResponse.json(
        { error: 'No exam sets found in file' },
        { status: 400 }
      );
    }

    // Store exam sets in database
    for (const [setCode, qs] of setMap) {
      // Create questions
      const questionsData = qs.map((q: any, idx: number) => ({
        question_number: idx + 1,
        content: q.content || q.question,
        type: q.type || 'mcq',
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
      }));

      // Insert questions and get IDs
      const { data: insertedQuestions, error: qError } = await supabaseAdmin
        .from('questions')
        .insert(questionsData)
        .select('id');

      if (qError) {
        console.error('Error inserting questions:', qError);
        continue;
      }

      // Create answer key for this set
      const answerKeyData: Record<number, string> = {};
      const setAnswers = answerKeys[setCode] || answerKeys['DEFAULT'] || {};

      qs.forEach((q: any, idx: number) => {
        const questionNum = idx + 1;
        answerKeyData[questionNum] =
          setAnswers[questionNum] || setAnswers[q.content] || '';
      });

      // Store exam set with questions
      await supabaseAdmin.from('exam_sets').insert([
        {
          name: `${examName} - ${setCode}`,
          set_code: setCode,
          subject: 'Uploaded',
          question_ids: insertedQuestions?.map((q) => q.id) || [],
          answer_key: answerKeyData,
          created_by: session.user.id,
        },
      ]);
    }

    return NextResponse.json({
      examName,
      subject: 'Uploaded',
      setCodes: setCodeList,
    });
  } catch (error) {
    console.error('Error uploading exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
