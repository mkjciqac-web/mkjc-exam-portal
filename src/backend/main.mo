import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";

import RegTypes "types/registration";
import QuestionTypes "types/question";
import QuizTypes "types/quiz";

import RegistrationApiMixin "mixins/registration-api";
import QuestionApiMixin "mixins/question-api";
import QuizApiMixin "mixins/quiz-api";
import SmsApiMixin "mixins/sms-api";



actor {
  // Access control state (required by authorization mixin)
  let accessControlState = AccessControl.initState();

  // Registration state
  let registrations = Map.empty<RegTypes.RegistrationId, RegTypes.Registration>();
  let nextRegistrationId = { var val : RegTypes.RegistrationId = 1 };
  let credentials = Map.empty<Text, RegTypes.StudentCredentials>();
  let credentialsByRegId = Map.empty<RegTypes.RegistrationId, Text>();

  // Question state
  let questions = Map.empty<QuestionTypes.QuestionId, QuestionTypes.Question>();
  let nextQuestionId = { var val : QuestionTypes.QuestionId = 1 };

  // Quiz response state
  let quizResponses = Map.empty<QuizTypes.QuizResponseId, QuizTypes.QuizResponse>();
  let nextQuizResponseId = { var val : QuizTypes.QuizResponseId = 1 };

  // SMS state
  let smsApiKey = { var val : Text = "" };
  let smsTotalSent = { var val : Nat = 0 };
  let smsTotalFailed = { var val : Nat = 0 };

  // Mixin inclusions
  include MixinAuthorization(accessControlState);
  include RegistrationApiMixin(registrations, nextRegistrationId, credentials, credentialsByRegId);
  include QuestionApiMixin(questions, nextQuestionId);
  include QuizApiMixin(quizResponses, registrations, nextQuizResponseId);
  include SmsApiMixin(smsApiKey, smsTotalSent, smsTotalFailed);
};
