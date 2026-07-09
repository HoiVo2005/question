import { pgTable, text, integer, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['teacher', 'student']);
export const questionTypeEnum = pgEnum('question_type', ['mcq', 'essay']);
export const submissionStatusEnum = pgEnum('submission_status', ['in_progress', 'submitted', 'graded']);

// Users table (Better Auth will manage basic auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  role: userRoleEnum('role').default('student').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Exams table
export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // in minutes
  passingScore: integer('passing_score').default(60), // percentage
  examCode: text('exam_code').unique().notNull(), // code for students to join
  isPublished: boolean('is_published').default(false),
  allowLateSubmission: boolean('allow_late_submission').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Questions table
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  type: questionTypeEnum('type').notNull(), // 'mcq' or 'essay'
  questionText: text('question_text').notNull(),
  questionImage: text('question_image'), // URL for question with images
  orderIndex: integer('order_index').notNull(),
  points: integer('points').default(1),
  // MCQ specific fields
  options: jsonb('options'), // [{label: 'A', text: '...'}, {label: 'B', text: '...'}, ...]
  correctAnswer: text('correct_answer'), // 'A', 'B', 'C', 'D'
  explanation: text('explanation'), // explanation for MCQ
  createdAt: timestamp('created_at').defaultNow(),
});

// Student submissions
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: submissionStatusEnum('status').default('in_progress'),
  startedAt: timestamp('started_at').defaultNow(),
  submittedAt: timestamp('submitted_at'),
  totalScore: integer('total_score'),
  maxScore: integer('max_score'),
  grade: text('grade'), // 'A', 'B', 'C', 'D', 'F'
  teacherFeedback: text('teacher_feedback'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Student answers
export const studentAnswers = pgTable('student_answers', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  // MCQ answer
  selectedOption: text('selected_option'), // 'A', 'B', 'C', 'D'
  isCorrect: boolean('is_correct'), // auto-calculated for MCQ
  // Essay answer
  essayImageUrl: text('essay_image_url'), // uploaded image URL
  essayText: text('essay_text'), // optional text with essay
  // Grading
  earnedPoints: integer('earned_points'),
  gradeComment: text('grade_comment'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// -----------------------------------------------------------------------------
// better-auth core tables (session / account / verification).
// Mapped with `usePlural: true` in auth.config.ts, so the export keys are plural
// (sessions/accounts/verifications) to match the existing `users` convention.
// -----------------------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  examsCreated: many(exams),
  submissions: many(submissions),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  teacher: one(users, { fields: [exams.teacherId], references: [users.id] }),
  questions: many(questions),
  submissions: many(submissions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, { fields: [questions.examId], references: [exams.id] }),
  studentAnswers: many(studentAnswers),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  exam: one(exams, { fields: [submissions.examId], references: [exams.id] }),
  student: one(users, { fields: [submissions.studentId], references: [users.id] }),
  answers: many(studentAnswers),
}));

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  submission: one(submissions, { fields: [studentAnswers.submissionId], references: [submissions.id] }),
  question: one(questions, { fields: [studentAnswers.questionId], references: [questions.id] }),
}));
