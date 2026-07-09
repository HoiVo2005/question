import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examName, setCodes } = await request.json();

    if (!examName || !setCodes || setCodes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get exam sets with answer keys
    const { data: examSets, error: queryError } = await supabaseAdmin
      .from('exam_sets')
      .select(
        `
        id,
        set_code,
        name,
        answer_keys(answers)
      `
      )
      .in('set_code', setCodes);

    if (queryError || !examSets) {
      return NextResponse.json(
        { error: 'Failed to fetch exam data' },
        { status: 500 }
      );
    }

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Mã Đề,Tên Đề,Câu Hỏi,Đáp Án\n';

    for (const set of examSets) {
      const answerKey = set.answer_keys?.[0]?.answers || {};
      
      for (const [questionNum, answer] of Object.entries(answerKey)) {
        csvContent += `"${set.set_code}","${set.name.replace(/"/g, '""')}","Câu ${questionNum}","${answer}"\n`;
      }
    }

    // Create downloadable link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `da-dap-an-${examName}-${new Date().getTime()}.csv`
    );

    // Convert to binary
    const blob = new Blob([decodeURIComponent(csvContent)], {
      type: 'text/csv;charset=utf-8;',
    });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="da-dap-an-${examName}.csv"`,
        'Content-Type': 'text/csv;charset=utf-8;',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
