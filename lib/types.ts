export type UserRole = 'teacher' | 'student';
export type QuestionType = 'mcq' | 'essay';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded';

export interface MCQOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  questionText: string;
  questionImage?: string;
  orderIndex: number;
  points: number;
  options?: MCQOption[];
  correctAnswer?: string;
  explanation?: string;
  figure?: any | null;
  chart?: any | null;
}

export interface Exam {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  examCode: string;
  isPublished: boolean;
  allowLateSubmission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentSubmission {
  id: string;
  examId: string;
  studentId: string;
  status: SubmissionStatus;
  startedAt: Date;
  submittedAt?: Date;
  totalScore?: number;
  maxScore?: number;
  grade?: string;
  teacherFeedback?: string;
}

export interface StudentAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  selectedOption?: string;
  isCorrect?: boolean;
  essayImageUrl?: string;
  essayText?: string;
  earnedPoints?: number;
  gradeComment?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
