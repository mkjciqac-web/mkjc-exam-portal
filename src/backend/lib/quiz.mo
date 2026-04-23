import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Types "../types/quiz";
import RegTypes "../types/registration";

module {
  public type QuizResponse = Types.QuizResponse;
  public type QuizResponseId = Types.QuizResponseId;
  public type RegistrationId = Types.RegistrationId;

  public func submit(
    responses : Map.Map<QuizResponseId, QuizResponse>,
    _registrations : Map.Map<RegistrationId, RegTypes.Registration>,
    nextId : { var val : QuizResponseId },
    registration_id : RegistrationId,
    question_index : Nat,
    question_text : Text,
    student_answer : Text,
    correct_answer : Text,
    is_correct : Bool,
    score : Nat,
    total_questions : Nat,
    percentage : Float,
    time_taken : Nat,
  ) : QuizResponseId {
    let id = nextId.val;
    let response : QuizResponse = {
      id;
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
    responses.add(id, response);
    nextId.val += 1;
    id;
  };

  public func getByRegistrationId(
    responses : Map.Map<QuizResponseId, QuizResponse>,
    registration_id : RegistrationId,
  ) : [QuizResponse] {
    responses.values()
      |> _.filter(func(r : QuizResponse) : Bool { r.registration_id == registration_id })
      |> _.toArray();
  };

  public func listAll(
    responses : Map.Map<QuizResponseId, QuizResponse>,
  ) : [QuizResponse] {
    responses.values() |> _.toArray();
  };

  public func topScores(
    responses : Map.Map<QuizResponseId, QuizResponse>,
    limit : Nat,
  ) : [QuizResponse] {
    let all = listAll(responses);
    let sorted = all.sort(func(a : QuizResponse, b : QuizResponse) : Order.Order {
      // descending by score
      Nat.compare(b.score, a.score)
    });
    if (limit == 0 or sorted.size() <= limit) {
      sorted
    } else {
      sorted.sliceToArray(0, limit.toInt())
    };
  };

  public func filterByRegistrationId(
    responses : Map.Map<QuizResponseId, QuizResponse>,
    registration_id : RegistrationId,
  ) : [QuizResponse] {
    getByRegistrationId(responses, registration_id);
  };

  public func compareBySubmissionTime(r1 : QuizResponse, r2 : QuizResponse) : Order.Order {
    Int.compare(r1.submitted_at, r2.submitted_at);
  };

  public func compareByScore(r1 : QuizResponse, r2 : QuizResponse) : Order.Order {
    Nat.compare(r1.score, r2.score);
  };
};
