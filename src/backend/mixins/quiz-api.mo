import Map "mo:core/Map";
import QuizLib "../lib/quiz";
import QuizTypes "../types/quiz";
import RegTypes "../types/registration";

mixin (
  quizResponses : Map.Map<QuizTypes.QuizResponseId, QuizTypes.QuizResponse>,
  registrations : Map.Map<RegTypes.RegistrationId, RegTypes.Registration>,
  nextQuizResponseId : { var val : QuizTypes.QuizResponseId },
) {

  public shared func submitQuizResponse(
    registration_id : RegTypes.RegistrationId,
    question_index : Nat,
    question_text : Text,
    student_answer : Text,
    correct_answer : Text,
    is_correct : Bool,
    score : Nat,
    total_questions : Nat,
    percentage : Float,
    time_taken : Nat,
  ) : async QuizTypes.QuizResponseId {
    QuizLib.submit(
      quizResponses,
      registrations,
      nextQuizResponseId,
      registration_id,
      question_index,
      question_text,
      student_answer,
      correct_answer,
      is_correct,
      score,
      total_questions,
      percentage,
      time_taken,
    );
  };

  public query func getQuizResponse(id : QuizTypes.QuizResponseId) : async ?QuizTypes.QuizResponse {
    quizResponses.get(id);
  };

  public query func listQuizResponses() : async [QuizTypes.QuizResponse] {
    QuizLib.listAll(quizResponses);
  };

  public query func filterQuizResponses(registration_id : RegTypes.RegistrationId) : async [QuizTypes.QuizResponse] {
    QuizLib.filterByRegistrationId(quizResponses, registration_id);
  };

  public query func getTopQuizScores(limit : Nat) : async [QuizTypes.QuizResponse] {
    QuizLib.topScores(quizResponses, limit);
  };
};
