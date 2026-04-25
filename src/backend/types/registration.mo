import Common "common";

module {
  public type RegistrationId = Common.RegistrationId;

  public type Registration = {
    id : RegistrationId;
    student_name : Text;
    date_of_birth : Text;
    aadhaar : Text;
    email : Text;
    contact_number : Text;
    whatsapp_number : Text;
    father_name : Text;
    parent_mobile : Text;
    mother_name : Text;
    school_name : Text;
    district : Text;
    exam_group : Text;
    choice1 : Text;
    choice2 : Text;
    choice3 : Text;
    test_key : Text;
    registration_date : Int;
  };

  public type RegistrationInput = {
    student_name : Text;
    date_of_birth : Text;
    aadhaar : Text;
    email : Text;
    contact_number : Text;
    whatsapp_number : Text;
    father_name : Text;
    parent_mobile : Text;
    mother_name : Text;
    school_name : Text;
    district : Text;
    exam_group : Text;
    choice1 : Text;
    choice2 : Text;
    choice3 : Text;
    test_key : Text;
  };

  public type StudentCredentials = {
    registration_id : RegistrationId;
    user_id : Text;
    password : Text;
    contact_number : Text;
    is_active : Bool;
  };
};
