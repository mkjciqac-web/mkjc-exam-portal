import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  //-------------------- Exams ---------------------
  type ExamId = Nat;
  type Exam = {
    id : ExamId;
    exam_name : Text;
    exam_date : Text;
    exam_time : Text;
    duration_minutes : Nat;
    no_of_questions : Nat;
    created_at : Int;
  };

  // Separate stable state for exams to avoid upgrade compatibility issues
  type ExamStateModel = {
    var nextExamId : ExamId;
    exams : Map.Map<ExamId, Exam>;
  };

  let examState : ExamStateModel = {
    var nextExamId = 1;
    exams = Map.empty<ExamId, Exam>();
  };

  //-------------------- Student Registration ---------------------
  type RegistrationId = Nat;

  type Registration = {
    id : RegistrationId;
    student_name : Text;
    school_name : Text;
    contact_number : Text;
    whatsapp_number : Text;
    exam_group : Text;
    test_key : Text;
    registration_date : Int;
  };

  module Registration {
    public func compare(r1 : Registration, r2 : Registration) : Order.Order {
      Nat.compare(r1.id, r2.id);
    };
  };

  //----------------------------------------------------------------
  //----------------------- Questions -------------------------------
  //----------------------------------------------------------------
  type QuestionType = { #text; #image };
  type QuestionTypeDTO = { #text; #image };

  type QuestionId = Nat;
  type Question = {
    id : QuestionId;
    test_key : Text;
    question_type : QuestionType;
    question_text_en : Text;
    question_image_en : Blob;
    option_a_en : Text;
    option_b_en : Text;
    option_c_en : Text;
    option_d_en : Text;
    correct_answer_en : Text;
    question_text_ta : Text;
    question_image_ta : Blob;
    option_a_ta : Text;
    option_b_ta : Text;
    option_c_ta : Text;
    option_d_ta : Text;
    correct_answer_ta : Text;
    question_order : Nat;
    is_active : Bool;
  };

  module Question {
    public func compare(q1 : Question, q2 : Question) : Order.Order {
      switch (Text.compare(q1.test_key, q2.test_key)) {
        case (#equal) { Nat.compare(q1.question_order, q2.question_order) };
        case (order) { order };
      };
    };
  };

  type QuestionDTO = {
    test_key : Text;
    question_type : QuestionTypeDTO;
    question_text_en : Text;
    question_image_en : Blob;
    option_a_en : Text;
    option_b_en : Text;
    option_c_en : Text;
    option_d_en : Text;
    correct_answer_en : Text;
    question_text_ta : Text;
    question_image_ta : Blob;
    option_a_ta : Text;
    option_b_ta : Text;
    option_c_ta : Text;
    option_d_ta : Text;
    correct_answer_ta : Text;
    question_order : Nat;
    is_active : Bool;
  };

  module QuestionDTO {
    public func compare(dto1 : QuestionDTO, dto2 : QuestionDTO) : Order.Order {
      switch (Text.compare(dto1.test_key, dto2.test_key)) {
        case (#equal) { Nat.compare(dto1.question_order, dto2.question_order) };
        case (order) { order };
      };
    };
  };

  //----------------------------------------------------------------
  //---------------------- Quiz Responses ---------------------------
  //----------------------------------------------------------------
  type QuizResponseId = Nat;
  type QuizResponse = {
    id : QuizResponseId;
    registration_id : RegistrationId;
    question_index : Nat;
    question_text : Text;
    student_answer : Text;
    correct_answer : Text;
    is_correct : Bool;
    score : Nat;
    total_questions : Nat;
    percentage : Float;
    time_taken : Nat;
    submitted_at : Int;
  };

  module QuizResponse {
    public func compareBySubmissionTime(r1 : QuizResponse, r2 : QuizResponse) : Order.Order {
      Int.compare(r1.submitted_at, r2.submitted_at);
    };

    public func compareByScore(r1 : QuizResponse, r2 : QuizResponse) : Order.Order {
      let scoreOrder = Nat.compare(r2.score, r1.score);
      switch (scoreOrder) {
        case (#equal) { Nat.compare(r1.time_taken, r2.time_taken) };
        case (order) { order };
      };
    };
  };

  //----------------------------------------------------------------
  //---------------------- State -----------------------------------
  //----------------------------------------------------------------
  type StateModel = {
    var nextRegistrationId : RegistrationId;
    registrations : Map.Map<RegistrationId, Registration>;
    var nextQuestionId : QuestionId;
    questions : Map.Map<QuestionId, Question>;
    var nextQuizResponseId : QuizResponseId;
    quizResponses : Map.Map<QuizResponseId, QuizResponse>;
  };

  let state : StateModel = {
    var nextRegistrationId = 1;
    registrations = Map.empty<RegistrationId, Registration>();
    var nextQuestionId = 1;
    questions = Map.empty<QuestionId, Question>();
    var nextQuizResponseId = 1;
    quizResponses = Map.empty<QuizResponseId, QuizResponse>();
  };

  //----------------------------------------------------------------
  //---------------------- Helper Functions -------------------------
  //----------------------------------------------------------------
  func toQuestionType(dto : QuestionTypeDTO) : QuestionType {
    switch (dto) {
      case (#text) { #text };
      case (#image) { #image };
    };
  };

  func fromQuestionType(qt : QuestionType) : QuestionTypeDTO {
    switch (qt) {
      case (#text) { #text };
      case (#image) { #image };
    };
  };

  func toQuestion(dto : QuestionDTO, id : QuestionId) : Question {
    {
      id;
      test_key = dto.test_key;
      question_type = toQuestionType(dto.question_type);
      question_text_en = dto.question_text_en;
      question_image_en = dto.question_image_en;
      option_a_en = dto.option_a_en;
      option_b_en = dto.option_b_en;
      option_c_en = dto.option_c_en;
      option_d_en = dto.option_d_en;
      correct_answer_en = dto.correct_answer_en;
      question_text_ta = dto.question_text_ta;
      question_image_ta = dto.question_image_ta;
      option_a_ta = dto.option_a_ta;
      option_b_ta = dto.option_b_ta;
      option_c_ta = dto.option_c_ta;
      option_d_ta = dto.option_d_ta;
      correct_answer_ta = dto.correct_answer_ta;
      question_order = dto.question_order;
      is_active = dto.is_active;
    };
  };

  func fromQuestion(question : Question) : QuestionDTO {
    {
      test_key = question.test_key;
      question_type = fromQuestionType(question.question_type);
      question_text_en = question.question_text_en;
      question_image_en = question.question_image_en;
      option_a_en = question.option_a_en;
      option_b_en = question.option_b_en;
      option_c_en = question.option_c_en;
      option_d_en = question.option_d_en;
      correct_answer_en = question.correct_answer_en;
      question_text_ta = question.question_text_ta;
      question_image_ta = question.question_image_ta;
      option_a_ta = question.option_a_ta;
      option_b_ta = question.option_b_ta;
      option_c_ta = question.option_c_ta;
      option_d_ta = question.option_d_ta;
      correct_answer_ta = question.correct_answer_ta;
      question_order = question.question_order;
      is_active = question.is_active;
    };
  };

  //----------------------------------------------------------------
  //---------------------- Exam Management -------------------------
  //----------------------------------------------------------------
  public shared func createExam(exam_name : Text, exam_date : Text, exam_time : Text, duration_minutes : Nat, no_of_questions : Nat) : async ExamId {
    let exam : Exam = {
      id = examState.nextExamId;
      exam_name;
      exam_date;
      exam_time;
      duration_minutes;
      no_of_questions;
      created_at = Time.now();
    };
    examState.exams.add(examState.nextExamId, exam);
    examState.nextExamId += 1;
    exam.id;
  };

  public query func getAllExams() : async [Exam] {
    examState.exams.values().toArray().sort(func(a, b) { Nat.compare(a.id, b.id) });
  };

  public shared func deleteExam(exam_id : ExamId) : async () {
    examState.exams.remove(exam_id);
  };

  //----------------------------------------------------------------
  //---------------------- Student Registration --------------------
  //----------------------------------------------------------------
  public shared func createRegistration(student_name : Text, school_name : Text, contact_number : Text, whatsapp_number : Text, exam_group : Text, test_key : Text) : async RegistrationId {
    let registration : Registration = {
      id = state.nextRegistrationId;
      student_name;
      school_name;
      contact_number;
      whatsapp_number;
      exam_group;
      test_key;
      registration_date = Time.now();
    };
    state.registrations.add(state.nextRegistrationId, registration);
    state.nextRegistrationId += 1;
    registration.id;
  };

  //----------------------------------------------------------------
  //---------------------- Questions -------------------------------
  //----------------------------------------------------------------
  public shared func createQuestion(dto : QuestionDTO) : async QuestionId {
    let question = toQuestion(dto, state.nextQuestionId);
    state.questions.add(state.nextQuestionId, question);
    state.nextQuestionId += 1;
    state.nextQuestionId - 1;
  };

  public shared func updateQuestion(question_id : QuestionId, dto : QuestionDTO) : async () {
    if (not state.questions.containsKey(question_id)) {
      Runtime.trap("Question not found");
    };
    let question = toQuestion(dto, question_id);
    state.questions.add(question_id, question);
  };

  public shared func deleteQuestionByTestKeyAndOrder(test_key : Text, question_order : Nat) : async () {
    let toDelete = state.questions.values().filter(
      func(q) { q.test_key == test_key and q.question_order == question_order }
    ).toArray();
    for (q in toDelete.vals()) {
      state.questions.remove(q.id);
    };
  };

  public shared func toggleQuestionActive(question_id : QuestionId) : async () {
    switch (state.questions.get(question_id)) {
      case (null) { Runtime.trap("Question not found") };
      case (?existing) {
        let updated = { existing with is_active = not existing.is_active };
        state.questions.add(question_id, updated);
      };
    };
  };

  //----------------------------------------------------------------
  //---------------------- Quiz Responses ---------------------------
  //----------------------------------------------------------------
  public shared func submitQuizResponse(registration_id : RegistrationId, question_index : Nat, question_text : Text, student_answer : Text, correct_answer : Text, is_correct : Bool, score : Nat, total_questions : Nat, percentage : Float, time_taken : Nat) : async QuizResponseId {
    switch (state.registrations.get(registration_id)) {
      case (null) { Runtime.trap("Registration not found") };
      case (?_) {
        let response : QuizResponse = {
          id = state.nextQuizResponseId;
          registration_id;
          question_index;
          question_text;
          student_answer;
          correct_answer;
          is_correct;
          score;
          total_questions;
          percentage;
          time_taken;
          submitted_at = Time.now();
        };
        state.quizResponses.add(state.nextQuizResponseId, response);
        state.nextQuizResponseId += 1;
        response.id;
      };
    };
  };

  //----------------------------------------------------------------
  //---------------------- Admin / Query Functions -----------------
  //----------------------------------------------------------------
  public query func getAllRegistrations() : async [Registration] {
    state.registrations.values().toArray().sort();
  };

  public shared func deleteRegistration(registration_id : RegistrationId) : async () {
    state.registrations.remove(registration_id);
  };

  public query func getQuestionsByTestKey(test_key : Text, activeOnly : Bool) : async [QuestionDTO] {
    let filteredQuestions = state.questions.values().filter(
      func(q) {
        (q.test_key == test_key) and (not activeOnly or q.is_active);
      }
    );
    filteredQuestions.toArray().map(fromQuestion).sort();
  };

  public query func getResponsesByRegistrationId(registration_id : RegistrationId) : async [QuizResponse] {
    state.quizResponses.values().filter(func(r) { r.registration_id == registration_id }).toArray().sort(QuizResponse.compareBySubmissionTime);
  };

  public query func getAllQuizResponses() : async [QuizResponse] {
    state.quizResponses.values().toArray().sort(QuizResponse.compareBySubmissionTime);
  };

  public query func getTopQuizScores(limit : Nat) : async [QuizResponse] {
    let topScores = state.quizResponses.values().toArray().sort(QuizResponse.compareByScore);
    topScores.sliceToArray(0, Nat.min(topScores.size(), limit));
  };
};
