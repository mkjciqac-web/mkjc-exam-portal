import Debug "mo:core/Debug";
import Common "common";

module {
  public type QuestionId = Common.QuestionId;

  public type QuestionType = { #text; #image };

  public type Question = {
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

  public type QuestionDTO = {
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
};
