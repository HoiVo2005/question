-- =============================================================================
-- AI Exam Generator — Supabase / Postgres schema
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- or via `psql "$DATABASE_URL" -f supabase/schema.sql`.
--
-- This single schema serves ALL three data layers the app uses against the
-- same Postgres database:
--   1. better-auth   (lib/auth-client.ts + auth.config.ts, via Drizzle adapter)
--   2. Drizzle ORM   (db/schema.ts — exams + shared tables)
--   3. supabase-js   (lib/supabase/client.ts — exam_sets, classrooms, ...)
--
-- Tables touched by more than one layer (users, questions, submissions,
-- student_answers) are defined as a SUPERSET of all columns each layer expects,
-- so nothing breaks regardless of which code path writes the row.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- users  (better-auth core "user" + Drizzle + supabase-js routes)
--   better-auth/supabase write `full_name`; Drizzle uses `name`. Both kept.
-- -----------------------------------------------------------------------------
create table if not exists users (
  id             text primary key default gen_random_uuid()::text,
  name           text,
  full_name      text,
  email          text not null unique,
  email_verified boolean default false,
  image          text,
  role           text not null default 'student' check (role in ('teacher', 'student')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- better-auth: sessions / accounts / verifications  (usePlural: true)
-- -----------------------------------------------------------------------------
create table if not exists sessions (
  id         text primary key default gen_random_uuid()::text,
  expires_at timestamptz not null,
  token      text not null unique,
  ip_address text,
  user_agent text,
  user_id    text not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists accounts (
  id                       text primary key default gen_random_uuid()::text,
  account_id               text not null,
  provider_id              text not null,
  user_id                  text not null references users(id) on delete cascade,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  password                 text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create table if not exists verifications (
  id         text primary key default gen_random_uuid()::text,
  identifier text not null,
  value      text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- exams  (Drizzle layer — db/schema.ts)
-- -----------------------------------------------------------------------------
create table if not exists exams (
  id                    text primary key default gen_random_uuid()::text,
  teacher_id            text not null references users(id) on delete cascade,
  title                 text not null,
  description           text,
  duration              integer not null,
  passing_score         integer default 60,
  exam_code             text not null unique,
  is_published          boolean default false,
  allow_late_submission boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- classrooms / classroom_students  (supabase-js layer)
-- -----------------------------------------------------------------------------
create table if not exists classrooms (
  id         text primary key default gen_random_uuid()::text,
  name       text not null,
  code       text unique,
  teacher_id text references users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists classroom_students (
  id           text primary key default gen_random_uuid()::text,
  classroom_id text references classrooms(id) on delete cascade,
  student_id   text references users(id) on delete cascade,
  joined_at    timestamptz default now(),
  unique (classroom_id, student_id)
);

-- -----------------------------------------------------------------------------
-- exam_sets / exam_room_sets  (supabase-js layer)
-- -----------------------------------------------------------------------------
create table if not exists exam_sets (
  id             text primary key default gen_random_uuid()::text,
  classroom_id   text references classrooms(id) on delete cascade,
  name           text,
  set_code       text,
  subject        text,
  start_time     timestamptz,
  end_time       timestamptz,
  question_count integer default 0,
  is_exam_room   boolean default false,
  question_ids   jsonb,
  answer_key     jsonb,
  created_by     text references users(id) on delete set null,
  created_at     timestamptz default now()
);

create table if not exists exam_room_sets (
  id           text primary key default gen_random_uuid()::text,
  exam_room_id text references exam_sets(id) on delete cascade,
  set_code     text,
  created_at   timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- questions  (SUPERSET: Drizzle + supabase-js)
-- -----------------------------------------------------------------------------
create table if not exists questions (
  id              text primary key default gen_random_uuid()::text,
  -- Drizzle FK
  exam_id         text references exams(id) on delete cascade,
  -- supabase-js FK
  exam_set_id     text references exam_sets(id) on delete cascade,
  type            text not null default 'mcq' check (type in ('mcq', 'essay')),
  -- Drizzle column / supabase-js column for the prompt text
  question_text   text,
  content         text,
  question_image  text,
  order_index     integer,
  question_number integer,
  points          integer default 1,
  options         jsonb,
  option_a        text,
  option_b        text,
  option_c        text,
  option_d        text,
  correct_answer  text,
  explanation     text,
  created_at      timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- submissions  (SUPERSET: Drizzle + supabase-js)
-- -----------------------------------------------------------------------------
create table if not exists submissions (
  id                 text primary key default gen_random_uuid()::text,
  exam_id            text references exams(id) on delete cascade,
  exam_set_id        text references exam_sets(id) on delete cascade,
  student_id         text not null references users(id) on delete cascade,
  status             text default 'in_progress' check (status in ('in_progress', 'submitted', 'graded')),
  started_at         timestamptz default now(),
  submitted_at       timestamptz,
  total_score        integer,
  max_score          integer,
  grade              text,
  teacher_feedback   text,
  auto_saved_answers jsonb,
  last_saved_at      timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- student_answers  (SUPERSET: Drizzle + supabase-js)
-- -----------------------------------------------------------------------------
create table if not exists student_answers (
  id              text primary key default gen_random_uuid()::text,
  submission_id   text not null references submissions(id) on delete cascade,
  question_id     text not null references questions(id) on delete cascade,
  selected_option text,
  is_correct      boolean,
  essay_image_url text,
  essay_text      text,
  earned_points   integer,
  grade_comment   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- answer_keys  (supabase-js layer)
-- -----------------------------------------------------------------------------
create table if not exists answer_keys (
  id          text primary key default gen_random_uuid()::text,
  exam_set_id text references exam_sets(id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  file_name   text,
  uploaded_at timestamptz default now(),
  created_at  timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Helpful indexes for the FK lookups the app does most often
-- -----------------------------------------------------------------------------
create index if not exists idx_questions_exam_set    on questions(exam_set_id);
create index if not exists idx_questions_exam         on questions(exam_id);
create index if not exists idx_submissions_exam_set   on submissions(exam_set_id);
create index if not exists idx_submissions_student    on submissions(student_id);
create index if not exists idx_student_answers_sub    on student_answers(submission_id);
create index if not exists idx_exam_sets_classroom    on exam_sets(classroom_id);
create index if not exists idx_answer_keys_exam_set   on answer_keys(exam_set_id);
create index if not exists idx_classroom_students_cls on classroom_students(classroom_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
--   Every server route talks to the DB with the service-role key, which BYPASSES
--   RLS. The browser anon client is only used for auth.signOut() and never reads
--   tables. So we enable RLS with no public policies: the anon key cannot read
--   or write any table, while the app keeps working through the service role.
-- -----------------------------------------------------------------------------
alter table users              enable row level security;
alter table sessions           enable row level security;
alter table accounts           enable row level security;
alter table verifications      enable row level security;
alter table exams              enable row level security;
alter table classrooms         enable row level security;
alter table classroom_students enable row level security;
alter table exam_sets          enable row level security;
alter table exam_room_sets     enable row level security;
alter table questions          enable row level security;
alter table submissions        enable row level security;
alter table student_answers    enable row level security;
alter table answer_keys        enable row level security;

-- -----------------------------------------------------------------------------
-- Storage bucket for uploaded essay images (app/api/student/submit-exam)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('exam-submissions', 'exam-submissions', true)
on conflict (id) do nothing;

-- Public read of submitted essay images (getPublicUrl). Uploads go through the
-- service role, which bypasses storage RLS.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public read exam-submissions'
  ) then
    create policy "Public read exam-submissions"
      on storage.objects for select
      using (bucket_id = 'exam-submissions');
  end if;
end $$;