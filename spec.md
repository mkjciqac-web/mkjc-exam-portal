# MKJC Exam Portal

## Current State
- Backend has Registration, Question, QuizResponse types with full CRUD
- Admin dashboard has tabs: Registrations, Questions, Results
- Homepage has hardcoded exam list: Test1, Test2, Test3
- No exam management or filter capabilities

## Requested Changes (Diff)

### Add
- `Exam` type in backend: id (auto-generated), exam_name, exam_date, exam_time, duration_minutes, no_of_questions, created_at
- Backend functions: createExam, getAllExams, deleteExam
- Admin dashboard "Exams" tab: create custom exams, list with delete
- Filter/search on Registrations tab: by student name, school name, exam/test key
- Filter/search on Results tab: by student name, exam/test key
- HomePage exam dropdown loads from backend (custom exams + fallback to Test1/2/3 if none)

### Modify
- `backend.d.ts` - add Exam type and methods
- `AdminPage.tsx` - add Exams tab, add filter bars to Registrations and Results tabs
- `HomePage.tsx` - fetch exams from backend for dropdown

### Remove
- Nothing removed

## Implementation Plan
1. Update main.mo to add Exam type, state, and CRUD functions
2. Update backend.d.ts and declarations to reflect new API
3. Update AdminPage.tsx: add Exams tab with create form and list, add filter inputs to Registrations and Results tabs
4. Update HomePage.tsx: fetch getAllExams on mount, populate dropdown with exam names/ids
