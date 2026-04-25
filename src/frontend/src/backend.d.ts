import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type QuizResponseId = bigint;
export interface Registration {
    id: RegistrationId;
    student_name: string;
    mother_name: string;
    registration_date: bigint;
    test_key: string;
    aadhaar: string;
    parent_mobile: string;
    email: string;
    district: string;
    contact_number: string;
    whatsapp_number: string;
    exam_group: string;
    date_of_birth: string;
    choice1: string;
    choice2: string;
    choice3: string;
    school_name: string;
    father_name: string;
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
    question_type: QuestionType;
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
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RegistrationInput {
    student_name: string;
    mother_name: string;
    test_key: string;
    aadhaar: string;
    parent_mobile: string;
    email: string;
    district: string;
    contact_number: string;
    whatsapp_number: string;
    exam_group: string;
    date_of_birth: string;
    choice1: string;
    choice2: string;
    choice3: string;
    school_name: string;
    father_name: string;
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
export interface StudentCredentials {
    password: string;
    user_id: string;
    contact_number: string;
    is_active: boolean;
    registration_id: RegistrationId;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export enum QuestionType {
    text = "text",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addQuestion(dto: QuestionDTO): Promise<QuestionId>;
    addRegistration(input: RegistrationInput): Promise<RegistrationId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteQuestion(question_id: QuestionId): Promise<void>;
    deleteRegistration(id: RegistrationId): Promise<void>;
    filterQuizResponses(registration_id: RegistrationId): Promise<Array<QuizResponse>>;
    generateStudentCredentials(registration_id: RegistrationId, contact_number: string): Promise<{
        password: string;
        user_id: string;
    }>;
    getAllStudentCredentials(): Promise<Array<StudentCredentials>>;
    getCallerUserRole(): Promise<UserRole>;
    getCredentialsByRegistrationId(registration_id: RegistrationId): Promise<StudentCredentials | null>;
    getFast2SmsApiKey(): Promise<string>;
    getQuestion(question_id: QuestionId): Promise<QuestionDTO | null>;
    getQuizResponse(id: QuizResponseId): Promise<QuizResponse | null>;
    getRegistration(id: RegistrationId): Promise<Registration | null>;
    getSmsStats(): Promise<{
        total_failed: bigint;
        api_key_set: boolean;
        total_sent: bigint;
    }>;
    getTopQuizScores(limit: bigint): Promise<Array<QuizResponse>>;
    httpTransform(input: TransformationInput): Promise<TransformationOutput>;
    isCallerAdmin(): Promise<boolean>;
    listQuestions(test_key: string, activeOnly: boolean): Promise<Array<QuestionDTO>>;
    listQuizResponses(): Promise<Array<QuizResponse>>;
    listRegistrations(): Promise<Array<Registration>>;
    sendSmsCredentials(phone: string, message: string): Promise<boolean>;
    sendTestSms(phone: string, message: string): Promise<[boolean, string]>;
    setFast2SmsApiKey(key: string): Promise<void>;
    submitQuizResponse(registration_id: RegistrationId, question_index: bigint, question_text: string, student_answer: string, correct_answer: string, is_correct: boolean, score: bigint, total_questions: bigint, percentage: number, time_taken: bigint): Promise<QuizResponseId>;
    toggleQuestionActive(question_id: QuestionId): Promise<void>;
    updateQuestion(question_id: QuestionId, dto: QuestionDTO): Promise<void>;
    validateStudentLogin(user_id: string, password: string): Promise<{
        test_key: string;
        registration_id: RegistrationId;
    }>;
}
