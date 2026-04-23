import Map "mo:core/Map";
import QuestionLib "../lib/question";
import QuestionTypes "../types/question";

mixin (
  questions : Map.Map<QuestionTypes.QuestionId, QuestionTypes.Question>,
  nextQuestionId : { var val : QuestionTypes.QuestionId },
) {

  public shared func addQuestion(dto : QuestionTypes.QuestionDTO) : async QuestionTypes.QuestionId {
    QuestionLib.add(questions, nextQuestionId, dto);
  };

  public shared func updateQuestion(question_id : QuestionTypes.QuestionId, dto : QuestionTypes.QuestionDTO) : async () {
    QuestionLib.update(questions, question_id, dto);
  };

  public shared func deleteQuestion(question_id : QuestionTypes.QuestionId) : async () {
    QuestionLib.remove(questions, question_id);
  };

  public query func getQuestion(question_id : QuestionTypes.QuestionId) : async ?QuestionTypes.QuestionDTO {
    switch (QuestionLib.get(questions, question_id)) {
      case (?q) { ?QuestionLib.fromQuestion(q) };
      case null { null };
    };
  };

  public query func listQuestions(test_key : Text, activeOnly : Bool) : async [QuestionTypes.QuestionDTO] {
    QuestionLib.listByTestKey(questions, test_key, activeOnly);
  };

  public shared func toggleQuestionActive(question_id : QuestionTypes.QuestionId) : async () {
    QuestionLib.toggleActive(questions, question_id);
  };
};
