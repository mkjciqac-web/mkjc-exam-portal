import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Types "../types/question";

module {
  public type Question = Types.Question;
  public type QuestionDTO = Types.QuestionDTO;
  public type QuestionId = Types.QuestionId;
  public type QuestionType = Types.QuestionType;

  public func toQuestion(dto : QuestionDTO, id : QuestionId) : Question {
    {
      id;
      test_key = dto.test_key;
      question_type = dto.question_type;
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

  public func fromQuestion(q : Question) : QuestionDTO {
    {
      test_key = q.test_key;
      question_type = q.question_type;
      question_text_en = q.question_text_en;
      question_image_en = q.question_image_en;
      option_a_en = q.option_a_en;
      option_b_en = q.option_b_en;
      option_c_en = q.option_c_en;
      option_d_en = q.option_d_en;
      correct_answer_en = q.correct_answer_en;
      question_text_ta = q.question_text_ta;
      question_image_ta = q.question_image_ta;
      option_a_ta = q.option_a_ta;
      option_b_ta = q.option_b_ta;
      option_c_ta = q.option_c_ta;
      option_d_ta = q.option_d_ta;
      correct_answer_ta = q.correct_answer_ta;
      question_order = q.question_order;
      is_active = q.is_active;
    };
  };

  public func add(
    questions : Map.Map<QuestionId, Question>,
    nextId : { var val : QuestionId },
    dto : QuestionDTO,
  ) : QuestionId {
    let id = nextId.val;
    let q = toQuestion(dto, id);
    questions.add(id, q);
    nextId.val += 1;
    id;
  };

  public func update(
    questions : Map.Map<QuestionId, Question>,
    question_id : QuestionId,
    dto : QuestionDTO,
  ) {
    let q = toQuestion(dto, question_id);
    questions.add(question_id, q);
  };

  public func remove(
    questions : Map.Map<QuestionId, Question>,
    question_id : QuestionId,
  ) {
    questions.remove(question_id);
  };

  public func get(
    questions : Map.Map<QuestionId, Question>,
    question_id : QuestionId,
  ) : ?Question {
    questions.get(question_id);
  };

  public func listByTestKey(
    questions : Map.Map<QuestionId, Question>,
    test_key : Text,
    activeOnly : Bool,
  ) : [QuestionDTO] {
    let filtered = questions.values()
      |> _.filter(func(q : Question) : Bool {
        (test_key == "" or q.test_key == test_key) and
        (not activeOnly or q.is_active)
      })
      |> _.toArray();
    let sorted = filtered.sort(func(a : Question, b : Question) : Order.Order {
      Nat.compare(a.question_order, b.question_order)
    });
    sorted.map<Question, QuestionDTO>(func(q) { fromQuestion(q) });
  };

  public func toggleActive(
    questions : Map.Map<QuestionId, Question>,
    question_id : QuestionId,
  ) {
    switch (questions.get(question_id)) {
      case (?q) {
        questions.add(question_id, { q with is_active = not q.is_active });
      };
      case null {};
    };
  };

  public func compareByOrder(q1 : QuestionDTO, q2 : QuestionDTO) : Order.Order {
    Nat.compare(q1.question_order, q2.question_order);
  };
};
