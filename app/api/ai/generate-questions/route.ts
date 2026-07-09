import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const QuestionSchema = z.object({
  questionText: z.string(),
  type: z.enum(['mcq', 'essay']),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string(),
  })).optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

const QuestionsSchema = z.object({
  questions: z.array(QuestionSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, subject, level, numQuestions } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    let prompt = '';

    if (type === 'text') {
      if (!content) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        );
      }

      prompt = `Based on the following course content, generate 10 multiple choice questions (MCQ) and 2 essay questions. The questions should be diverse and test different levels of understanding.

Course Content:
${content}

For MCQ questions:
- Include 4 options (A, B, C, D)
- Provide the correct answer
- Include a brief explanation

For essay questions:
- Ask open-ended questions that require critical thinking
- Do not provide options`;
    } else if (type === 'subject') {
      if (!subject) {
        return NextResponse.json(
          { error: 'Subject is required' },
          { status: 400 }
        );
      }

      const num = numQuestions || 10;
      prompt = `Generate ${num} high-quality multiple choice exam questions for ${subject} at ${level} level. 
      
About 80% should be MCQ with 4 options (A, B, C, D) each, and 20% should be essay questions.

For each MCQ:
- Include clear question text
- Provide 4 well-crafted options
- Mark the correct answer
- Include a brief explanation

For each essay:
- Ask open-ended questions that require critical thinking

Make the questions educational and appropriate for ${level} level students.`;
    }

    const result = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: QuestionsSchema,
      prompt,
    });

    return NextResponse.json({
      questions: result.object.questions,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
