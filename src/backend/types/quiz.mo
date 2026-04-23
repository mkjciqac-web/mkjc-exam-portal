import Debug "mo:core/Debug";
import Common "common";

module {
  public type QuizResponseId = Common.QuizResponseId;
  public type RegistrationId = Common.RegistrationId;

  public type QuizResponse = {
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
};
