# Cron Jobs & Background Tasks Setup

This document explains how to set up background jobs for auto-submitting exams and auto-grading MCQ questions.

## Overview

The platform includes two main background jobs:

1. **Auto-Submit Exams**: Automatically submits exams when the exam time expires
2. **Auto-Grade MCQ**: Automatically grades multiple-choice questions based on answer keys

## Setup Instructions

### 1. Set CRON_SECRET Environment Variable

First, generate a secure random token and add it to your environment variables:

```bash
# Generate a random token
openssl rand -base64 32

# Add to your environment:
# CRON_SECRET=your_generated_token_here
```

### 2. Configure Vercel Cron Jobs

If you're deploying to Vercel, you can use Vercel Cron Functions. Create a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/jobs/auto-submit-exams",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/jobs/auto-grade-mcq",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 3. Call the APIs from External Service

Alternatively, you can call the endpoints from an external cron service like:
- **EasyCron** (easycron.com)
- **Cron-Job.org**
- **AWS CloudWatch Events**
- **Google Cloud Scheduler**

Example curl command:

```bash
curl -X POST https://your-domain.com/api/jobs/auto-submit-exams \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 4. Schedule Frequency Recommendations

- **Auto-Submit Exams**: Every 5 minutes (`*/5 * * * *`)
  - This ensures exams are submitted within 5 minutes of expiration
  
- **Auto-Grade MCQ**: Every 10 minutes (`*/10 * * * *`)
  - Grades MCQ answers shortly after submission
  - Essays remain pending for teacher review

## How It Works

### Auto-Submit Process

1. Job runs at scheduled interval
2. Finds all in-progress submissions where `end_time` < current time
3. Updates their status to `submitted`
4. Returns count of submitted exams

### Auto-Grade Process

1. Job runs at scheduled interval
2. Finds all submitted exams
3. For each MCQ question:
   - Compares student answer with answer key
   - Updates `is_correct` flag
   - Assigns points (1 for correct, 0 for incorrect)
4. Calculates total score
5. If exam has essays, keeps status as `submitted` (awaiting teacher review)
6. If exam is all MCQ, updates status to `graded`
7. Returns count of graded exams

## Monitoring

### Check Job Status

Add the following to your logging system to monitor job execution:

```bash
# Monitor auto-submit job logs
curl -X POST https://your-domain.com/api/jobs/auto-submit-exams \
  -H "Authorization: Bearer YOUR_CRON_SECRET" | jq .

# Monitor auto-grade job logs  
curl -X POST https://your-domain.com/api/jobs/auto-grade-mcq \
  -H "Authorization: Bearer YOUR_CRON_SECRET" | jq .
```

### Response Examples

**Auto-Submit Success:**
```json
{
  "message": "Auto-submit job completed",
  "submittedCount": 5,
  "processedAt": "2024-06-02T10:30:00.000Z"
}
```

**Auto-Grade Success:**
```json
{
  "message": "Auto-grade job completed",
  "gradedCount": 8,
  "processedAt": "2024-06-02T10:35:00.000Z"
}
```

## Email Notifications (Optional)

To add email notifications when exams are auto-submitted or graded, you can:

1. Install Resend or SendGrid
2. Add email templates
3. Call email API from job endpoints after updating database

Example:

```typescript
// After auto-submitting
if (submittedCount > 0) {
  await sendEmail({
    to: teacherEmail,
    template: 'exam-auto-submitted',
    data: { count: submittedCount }
  });
}
```

## Troubleshooting

### Job Not Running

1. Verify `CRON_SECRET` is set correctly in environment
2. Check job response returns 200 status
3. Verify database permissions are correct
4. Check Supabase/database connection is working

### Jobs Running But Not Processing

1. Check if there are actually submissions to process
2. Verify `status` values match ('in_progress', 'submitted')
3. Check database timestamps are in UTC
4. Review console logs for database errors

### Performance Issues

If jobs take too long to complete:

1. Add pagination to process submissions in batches
2. Increase job frequency to process fewer submissions per run
3. Optimize database queries with proper indexes
4. Consider splitting into multiple smaller jobs

## Future Enhancements

1. **AI-Powered Essay Grading**: Use Groq API to auto-grade essays
2. **Email Notifications**: Notify teachers when exams are ready for grading
3. **Webhooks**: Trigger external systems when jobs complete
4. **Job Retries**: Implement retry logic for failed submissions
5. **Job History**: Log all job executions for audit trail
