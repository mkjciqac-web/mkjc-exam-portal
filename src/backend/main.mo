import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";
import HttpOutcalls "mo:caffeineai-http-outcalls/outcall";

actor {
  // Keep these stable variables from the previous version to avoid upgrade compatibility errors.
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // SMS API key (set by admin via setFast2SmsApiKey)
  var smsApiKey : Text = "";

  // SMS tracking
  var smsTotalSent : Nat = 0;
  var smsTotalFailed : Nat = 0;

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
  //-------------------- Student Credentials -----------------------
  //----------------------------------------------------------------
  type StudentCredentials = {
    registration_id : RegistrationId;
    user_id : Text;
    password : Text;
    contact_number : Text;
    is_active : Bool;
  };

  let credentials = Map.empty<Text, StudentCredentials>(); // keyed by user_id
  let credentialsByRegId = Map.empty<RegistrationId, Text>(); // regId -> user_id

  // Generate an 8-char alphanumeric password from a seed number
  func generatePassword(seed : Nat) : Text {
    let chars : [Char] = [
      'A','B','C','D','E','F','G','H','J','K','L','M',
      'N','P','Q','R','S','T','U','V','W','X','Y','Z',
      '2','3','4','5','6','7','8','9'
    ];
    let len = chars.size();
    var s = seed;
    var result = "";
    var i = 0;
    while (i < 8) {
      let idx = s % len;
      result := result # Text.fromChar(chars[idx]);
      s := (s / len + s * 7 + 13) % 9999991;
      i += 1;
    };
    result;
  };

  // Generate user_id from registration_id (e.g. STU001001)
  func generateUserId(regId : RegistrationId) : Text {
    let padded = regId.toText();
    var zeros = "";
    var n : Nat = if (padded.size() >= 6) 0 else 6 - padded.size();
    while (n > 0) { zeros := zeros # "0"; n -= 1; };
    "STU" # zeros # padded;
  };

  // Transform function for HTTP outcalls (strips headers for consensus)
  public query func httpTransform(input : HttpOutcalls.TransformationInput) : async HttpOutcalls.TransformationOutput {
    HttpOutcalls.transform(input);
  };

  public shared func generateStudentCredentials(registration_id : RegistrationId, contact_number : Text) : async { user_id : Text; password : Text } {
    // Return existing credentials if already generated
    switch (credentialsByRegId.get(registration_id)) {
      case (?existingUserId) {
        switch (credentials.get(existingUserId)) {
          case (?cred) {
            return { user_id = cred.user_id; password = cred.password };
          };
          case null {};
        };
      };
      case null {};
    };

    let user_id = generateUserId(registration_id);
    let timeNow = Int.abs(Time.now());
    let seed = registration_id + (timeNow % 999983);
    let password = generatePassword(seed);

    let cred : StudentCredentials = {
      registration_id;
      user_id;
      password;
      contact_number;
      is_active = true;
    };
    credentials.add(user_id, cred);
    credentialsByRegId.add(registration_id, user_id);

    // Attempt SMS (best effort, ignore failures)
    if (smsApiKey != "") {
      let sent = await sendSmsInternal(contact_number, "Your MKJC Exam Portal credentials: User ID: " # user_id # " Password: " # password # ". Use these to login and take your exam.");
      if (sent) {
        smsTotalSent += 1;
      } else {
        smsTotalFailed += 1;
      };
    };

    { user_id; password };
  };

  public shared func validateStudentLogin(user_id : Text, password : Text) : async { registration_id : RegistrationId; test_key : Text } {
    switch (credentials.get(user_id)) {
      case null { Runtime.trap("Invalid credentials") };
      case (?cred) {
        if (cred.password != password) {
          Runtime.trap("Invalid credentials");
        };
        if (not cred.is_active) {
          Runtime.trap("Account is inactive");
        };
        switch (state.registrations.get(cred.registration_id)) {
          case null { Runtime.trap("Registration not found") };
          case (?reg) {
            { registration_id = reg.id; test_key = reg.test_key };
          };
        };
      };
    };
  };

  public query func getCredentialsByRegistrationId(registration_id : RegistrationId) : async ?StudentCredentials {
    switch (credentialsByRegId.get(registration_id)) {
      case null null;
      case (?uid) credentials.get(uid);
    };
  };

  public query func getAllStudentCredentials() : async [StudentCredentials] {
    credentials.values().toArray();
  };

  //----------------------------------------------------------------
  //---------------------- SMS via Fast2SMS ------------------------
  //----------------------------------------------------------------
  public shared func setFast2SmsApiKey(key : Text) : async () {
    smsApiKey := key;
  };

  public query func getFast2SmsApiKey() : async Text {
    smsApiKey;
  };

  public shared func sendTestSms(phone : Text, message : Text) : async Bool {
    let result = await sendSmsInternal(phone, message);
    if (result) {
      smsTotalSent += 1;
    } else {
      smsTotalFailed += 1;
    };
    result;
  };

  public query func getSmsStats() : async { total_sent : Nat; total_failed : Nat; api_key_set : Bool } {
    {
      total_sent = smsTotalSent;
      total_failed = smsTotalFailed;
      api_key_set = smsApiKey != "";
    };
  };

  func sendSmsInternal(phone : Text, message : Text) : async Bool {
    let url = "https://www.fast2sms.com/dev/bulkV2";
    let body = "{\"route\":\"q\",\"message\":\"" # message # "\",\"language\":\"english\",\"flash\":0,\"numbers\":\"" # phone # "\"}";
    let headers : [HttpOutcalls.Header] = [
      { name = "authorization"; value = smsApiKey },
      { name = "Content-Type"; value = "application/json" },
    ];
    try {
      ignore await HttpOutcalls.httpPostRequest(url, headers, body, httpTransform);
      true;
    } catch (_) {
      false;
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
