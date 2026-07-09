# ExamHub - Online Exam Platform

An all-in-one platform for creating, taking, and grading exams online with AI-powered exam generation.

## Features

### For Teachers
- **Create/Manage Exams**:
  - Generate exams using AI (by subject or text content)
  - Upload exams from Excel, Word, or PDF files
  - Multiple exam sets with different question randomization
  - Support for multiple-choice (MCQ) and essay questions
- **Classroom Management**:
  - Create exam rooms with multiple exam codes
  - Import students via CSV/Excel
  - Control exam start/end times
  - Auto-submit when time expires
- **Grading & Analytics**:
  - Automatic MCQ grading
  - Manual essay grading with feedback
  - AI-powered answer explanations
  - Detailed student performance analytics
  - Export results and statistics

### For Students
- **Exam Features**:
  - Join exams with exam code
  - Real-time countdown timer
  - Answer MCQ and essay questions with image upload
  - Auto-save every 30 seconds
  - Auto-submit when time expires
- **Results**:
  - View scores and detailed feedback
  - See correct/incorrect answers
  - AI explanations for wrong answers
  - Access exam history

### AI Features
- **Multiple Generation Methods**:
  - Generate by subject (8 subjects: Math, Physics, Chemistry, Biology, English, History, Geography, Economics)
  - Generate from text content (paste curriculum, textbooks, lecture notes)
- **Smart Generation**:
  - Multiple exam sets with unique randomized questions
  - Configurable difficulty levels (Easy, Medium, Hard)
  - Automatic answer key generation
  - Support for 1-10 different exam codes per batch
- **Export Options**:
  - Download answer keys as Excel files
  - Print-ready format for answer keys
  - Direct integration with exam rooms

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **AI**: Groq API (via Vercel AI SDK)
- **File Processing**: XLSX (Excel), Mammoth (Word), pdf-parse (PDF)
- **PDF Export**: pdf-lib, html2canvas
- **Storage**: Supabase Storage (for essay images)

## Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Vercel account (for deployment)

## Getting Started

### 1. Clone and Install

```bash
git clone <repo>
cd examhub
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for local)

### 3. Set Up Database

```bash
# Push schema to database
pnpm drizzle-kit push

# Generate database types
pnpm drizzle-kit generate
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### For Teachers

1. **Sign Up** as a Teacher
2. **Create Exam**:
   - Go to Dashboard → Create Exam
   - Enter exam details (title, duration, passing score)
   - Choose how to add questions:
     - Manual creation
     - Upload file
     - AI generation (from text or subject)
3. **Publish Exam** and share exam code with students
4. **Grade Submissions**:
   - View all student submissions
   - Grade essay questions
   - Provide feedback
   - Auto-grading for MCQs
5. **View Analytics**: See student performance and exam statistics

### For Students

1. **Sign Up** as a Student
2. **Join Exam**: Enter the exam code provided by your teacher
3. **Take Exam**:
   - Answer questions within the time limit
   - MCQ: Select one option
   - Essay: Upload image or write text
   - Auto-save functionality
4. **Submit**: Submit when ready or when time runs out
5. **View Results**: See results and feedback after teacher grades

## Project Structure

```
examhub/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/        # Authentication
│   │   ├── student/     # Student endpoints
│   │   ├── teacher/     # Teacher endpoints
│   │   ├── ai/          # AI generation
│   │   └── export/      # PDF export
│   ├── student/         # Student pages
│   ├── teacher/         # Teacher pages
│   └── page.tsx         # Home page
├── components/
│   ├── exam/            # Exam taking components
│   ├── grading/         # Grading components
│   ├── auth/            # Auth components
│   └── ui/              # UI components (shadcn)
├── db/
│   ├── schema.ts        # Database schema
│   └── client.ts        # Database client
├── lib/
│   ├── types.ts         # TypeScript types
│   ├── auth-client.ts   # Auth client
│   ├── exam-utils.ts    # Exam utilities
│   └── pdf-export.ts    # PDF generation
└── public/              # Static assets
```

## Database Schema

### Key Tables
- **users** - User accounts (students and teachers)
- **exams** - Exam metadata
- **questions** - MCQ and essay questions
- **submissions** - Student exam submissions
- **studentAnswers** - Individual question answers
- **grades** - Exam grades and scores

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/session` - Get current session

### Student
- `POST /api/student/join-exam` - Join exam with code
- `GET /api/student/exams` - List student exams
- `GET /api/student/exam/[id]` - Get exam details
- `POST /api/student/submit-exam` - Submit exam answers
- `GET /api/student/results/[id]` - Get exam results

### Teacher
- `GET /api/teacher/exams` - List teacher exams
- `POST /api/teacher/exams` - Create exam
- `DELETE /api/teacher/exams/[id]` - Delete exam
- `GET /api/teacher/exam/[id]/submissions` - Get submissions
- `POST /api/teacher/exam/[id]/grade/[subId]` - Grade essay

### AI
- `POST /api/ai/generate-questions` - Generate exam questions

### Export
- `GET /api/export/exam-pdf` - Export exam to PDF
- `GET /api/export/results-pdf` - Export results to PDF

## Features in Detail

### AI Exam Generation
Two modes:
1. **From Text**: Paste curriculum content, and AI creates relevant questions
2. **From Subject**: Select subject and difficulty level

Supported subjects:
- Mathematics
- Physics
- Chemistry
- Biology
- English
- History
- Geography
- Economics

### Question Types

**Multiple Choice (MCQ)**
- 4 options (A, B, C, D)
- Automatic grading
- Optional explanations
- Points per question

**Essay**
- Image upload (student solutions)
- Optional text notes
- Manual grading by teacher
- Points per question

### Grading System

- **MCQ**: Automatic grading
- **Essay**: Manual grading by teacher
- **Grade Calculation**: Total points / max points
- **Grade Letters**: A (90+), B (80+), C (70+), D (60+), F (<60)

## Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=...

# AI
OPENAI_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Create project on Vercel
3. Connect GitHub repo
4. Set environment variables in Vercel dashboard
5. Deploy

```bash
vercel
```

### Alternative Hosting

Works with any Node.js hosting:
- Railway
- Render
- AWS
- DigitalOcean
- etc.

## Development

### Database Management

```bash
# Push schema changes
pnpm drizzle-kit push

# Generate migrations
pnpm drizzle-kit generate

# Studio (GUI for database)
pnpm drizzle-kit studio
```

### Code Quality

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify network access to database

### Auth Issues
- Generate new BETTER_AUTH_SECRET: `openssl rand -base64 32`
- Clear cookies and try again
- Check browser console for errors

### AI Generation Not Working
- Verify OPENAI_API_KEY is set correctly
- Check OpenAI account has credits
- Review API usage in OpenAI dashboard

## Future Enhancements

- [ ] Multiple-file question uploads
- [ ] Question bank and reusable questions
- [ ] Class management and student groups
- [ ] Plagiarism detection for essays
- [ ] Advanced analytics and reporting
- [ ] Mobile app
- [ ] Proctoring/monitoring
- [ ] Integration with LMS (Canvas, Blackboard)
- [ ] Batch grading with AI assistance
- [ ] Question difficulty analytics

## License

MIT

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check database schema
4. Open an issue on GitHub

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a pull request
