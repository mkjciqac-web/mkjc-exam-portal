import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import RegLib "../lib/registration";
import RegTypes "../types/registration";

mixin (
  registrations : Map.Map<RegTypes.RegistrationId, RegTypes.Registration>,
  nextRegistrationId : { var val : RegTypes.RegistrationId },
  credentials : Map.Map<Text, RegTypes.StudentCredentials>,
  credentialsByRegId : Map.Map<RegTypes.RegistrationId, Text>,
) {

  public shared func addRegistration(
    input : RegTypes.RegistrationInput,
  ) : async RegTypes.RegistrationId {
    RegLib.add(
      registrations,
      nextRegistrationId,
      input,
    );
  };

  public query func getRegistration(id : RegTypes.RegistrationId) : async ?RegTypes.Registration {
    RegLib.get(registrations, id);
  };

  public query func listRegistrations() : async [RegTypes.Registration] {
    RegLib.listAll(registrations);
  };

  public shared func deleteRegistration(id : RegTypes.RegistrationId) : async () {
    RegLib.remove(registrations, id);
  };

  public shared func generateStudentCredentials(
    registration_id : RegTypes.RegistrationId,
    contact_number : Text,
  ) : async { user_id : Text; password : Text } {
    let cred = RegLib.addCredentials(
      credentials,
      credentialsByRegId,
      registration_id,
      contact_number,
    );
    { user_id = cred.user_id; password = cred.password };
  };

  public shared func validateStudentLogin(
    user_id : Text,
    password : Text,
  ) : async { registration_id : RegTypes.RegistrationId; test_key : Text } {
    switch (RegLib.validateLogin(credentials, user_id, password)) {
      case (?cred) {
        switch (RegLib.get(registrations, cred.registration_id)) {
          case (?reg) { { registration_id = cred.registration_id; test_key = reg.test_key } };
          case null { { registration_id = cred.registration_id; test_key = "" } };
        };
      };
      case null {
        Runtime.trap("Invalid credentials");
      };
    };
  };

  public query func getCredentialsByRegistrationId(
    registration_id : RegTypes.RegistrationId,
  ) : async ?RegTypes.StudentCredentials {
    RegLib.getCredentialsByRegId(credentials, credentialsByRegId, registration_id);
  };

  public query func getAllStudentCredentials() : async [RegTypes.StudentCredentials] {
    RegLib.listAllCredentials(credentials);
  };
};
