import Debug "mo:core/Debug";
import Common "common";

module {
  public type RegistrationId = Common.RegistrationId;

  public type Registration = {
    id : RegistrationId;
    student_name : Text;
    school_name : Text;
    contact_number : Text;
    whatsapp_number : Text;
    exam_group : Text;
    test_key : Text;
    registration_date : Int;
  };

  public type StudentCredentials = {
    registration_id : RegistrationId;
    user_id : Text;
    password : Text;
    contact_number : Text;
    is_active : Bool;
  };
};
