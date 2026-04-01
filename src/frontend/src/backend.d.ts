import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ExamId = bigint;
export interface Exam {
    id: ExamId;
    exam_name: string;
    exam_date: string;
    exam_time: string;
    duration_minutes: bigint;
    no_of_questions: bigint;
    created_at: bigint;
}
export type QuizResponseId = bigint;
export interface Registration {
    id: RegistrationId;
    student_name: string;
    registration_date: bigint;
    test_key: string;
    contact_number: string;
    whatsapp_number: string;
    exam_group: string;
    school_name: string;
}
export type QuestionId = bigint;
export type RegistrationId = bigint;
export interface QuestionDTO {
    option_a_en: string;
    option_a_ta: string;
    option_b_en: string;
    option_b_ta: string;
    option_c_en: string;
    option_c_ta: string;
    option_d_en: string;
    option_d_ta: string;
    question_type: QuestionTypeDTO;
    question_order: bigint;
    test_key: string;
    question_text_en: string;
    question_text_ta: string;
    is_active: boolean;
    question_image_en: Uint8Array;
    question_image_ta: Uint8Array;
    correct_answer_en: string;
    correct_answer_ta: string;
}
export interface UserProfile {
    name: string;
}
export interface QuizResponse {
    id: QuizResponseId;
    question_text: string;
    is_correct: boolean;
    correct_answer: string;
    time_taken: bigint;
    score: bigint;
    question_index: bigint;
    student_answer: string;
    registration_id: RegistrationId;
    total_questions: bigint;
    percentage: number;
    submitted_at: bigint;
}
export enum QuestionTypeDTO {
    text = "text",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExam(exam_name: string, exam_date: string, exam_time: string, duration_minutes: bigint, no_of_questions: bigint): Promise<ExamId>;
    getAllExams(): Promise<Array<Exam>>;
    deleteExam(exam_id: ExamId): Promise<void>;
    createQuestion(dto: QuestionDTO): Promise<QuestionId>;
    createRegistration(student_name: string, school_name: string, contact_number: string, whatsapp_number: string, exam_group: string, test_key: string): Promise<RegistrationId>;
    deleteRegistration(registration_id: RegistrationId): Promise<void>;
    getAllQuizResponses(): Promise<Array<QuizResponse>>;
    getAllRegistrations(): Promise<Array<Registration>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getQuestionsByTestKey(test_key: string, activeOnly: boolean): Promise<Array<QuestionDTO>>;
    getResponsesByRegistrationId(registration_id: RegistrationId): Promise<Array<QuizResponse>>;
    getTopQuizScores(limit: bigint): Promise<Array<QuizResponse>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitQuizResponse(registration_id: RegistrationId, question_index: bigint, question_text: string, student_answer: string, correct_answer: string, is_correct: boolean, score: bigint, total_questions: bigint, percentage: number, time_taken: bigint): Promise<QuizResponseId>;
    toggleQuestionActive(question_id: QuestionId): Promise<void>;
    updateQuestion(question_id: QuestionId, dto: QuestionDTO): Promise<void>;
    deleteQuestionByTestKeyAndOrder(test_key: string, question_order: bigint): Promise<void>;
}
