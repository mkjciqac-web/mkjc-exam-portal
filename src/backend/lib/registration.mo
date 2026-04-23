import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Types "../types/registration";

module {
  public type Registration = Types.Registration;
  public type StudentCredentials = Types.StudentCredentials;
  public type RegistrationId = Types.RegistrationId;

  // ---- Registration CRUD ----

  public func add(
    registrations : Map.Map<RegistrationId, Registration>,
    nextId : { var val : RegistrationId },
    student_name : Text,
    school_name : Text,
    contact_number : Text,
    whatsapp_number : Text,
    exam_group : Text,
    test_key : Text,
  ) : RegistrationId {
    let id = nextId.val;
    let reg : Registration = {
      id;
      student_name;
      school_name;
      contact_number;
      whatsapp_number;
      exam_group;
      test_key;
      registration_date = Time.now();
    };
    registrations.add(id, reg);
    nextId.val += 1;
    id;
  };

  public func get(
    registrations : Map.Map<RegistrationId, Registration>,
    id : RegistrationId,
  ) : ?Registration {
    registrations.get(id);
  };

  public func listAll(
    registrations : Map.Map<RegistrationId, Registration>,
  ) : [Registration] {
    registrations.values() |> _.toArray();
  };

  public func remove(
    registrations : Map.Map<RegistrationId, Registration>,
    id : RegistrationId,
  ) {
    registrations.remove(id);
  };

  // ---- Credentials ----

  public func generateUserId(regId : RegistrationId) : Text {
    let regText = regId.toText();
    let pad = if (regText.size() < 3) {
      var p = "";
      var i = regText.size();
      while (i < 3) { p #= "0"; i += 1 };
      p;
    } else { "" };
    "STU" # "001" # pad # regText;
  };

  public func generatePassword(seed : Nat) : Text {
    let chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let len = chars.size();
    var pwd = "";
    var s = seed + 13337;
    var i = 0;
    while (i < 8) {
      s := (s * 6364136223846793005 + 1442695040888963407) % 4294967296;
      let idx = s % len;
      // get character at index
      var j = 0;
      for (c in chars.toIter()) {
        if (j == idx) { pwd #= Text.fromChar(c) };
        j += 1;
      };
      i += 1;
    };
    pwd;
  };

  public func addCredentials(
    credentials : Map.Map<Text, StudentCredentials>,
    credentialsByRegId : Map.Map<RegistrationId, Text>,
    registration_id : RegistrationId,
    contact_number : Text,
  ) : StudentCredentials {
    let user_id = generateUserId(registration_id);
    let password = generatePassword(registration_id);
    let cred : StudentCredentials = {
      registration_id;
      user_id;
      password;
      contact_number;
      is_active = true;
    };
    credentials.add(user_id, cred);
    credentialsByRegId.add(registration_id, user_id);
    cred;
  };

  public func getCredentialsByRegId(
    credentials : Map.Map<Text, StudentCredentials>,
    credentialsByRegId : Map.Map<RegistrationId, Text>,
    registration_id : RegistrationId,
  ) : ?StudentCredentials {
    switch (credentialsByRegId.get(registration_id)) {
      case (?user_id) { credentials.get(user_id) };
      case null { null };
    };
  };

  public func validateLogin(
    credentials : Map.Map<Text, StudentCredentials>,
    user_id : Text,
    password : Text,
  ) : ?StudentCredentials {
    switch (credentials.get(user_id)) {
      case (?cred) {
        if (cred.password == password and cred.is_active) { ?cred } else { null };
      };
      case null { null };
    };
  };

  public func listAllCredentials(
    credentials : Map.Map<Text, StudentCredentials>,
  ) : [StudentCredentials] {
    credentials.values() |> _.toArray();
  };
};
