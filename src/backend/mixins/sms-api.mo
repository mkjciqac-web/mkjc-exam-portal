import HttpOutcalls "mo:caffeineai-http-outcalls/outcall";
import SmsLib "../lib/sms";

mixin (
  smsApiKey : { var val : Text },
  smsTotalSent : { var val : Nat },
  smsTotalFailed : { var val : Nat },
) {

  public query func httpTransform(input : HttpOutcalls.TransformationInput) : async HttpOutcalls.TransformationOutput {
    HttpOutcalls.transform(input);
  };

  public shared func setFast2SmsApiKey(key : Text) : async () {
    smsApiKey.val := key;
  };

  public query func getFast2SmsApiKey() : async Text {
    smsApiKey.val;
  };

  public shared func sendTestSms(phone : Text, message : Text) : async (Bool, Text) {
    if (smsApiKey.val == "") {
      smsTotalFailed.val += 1;
      return (false, "API key is not configured. Please set your Fast2SMS API key in Settings.");
    };
    let url = "https://www.fast2sms.com/dev/bulkV2";
    let headers = SmsLib.buildSmsHeaders(smsApiKey.val);
    let body = SmsLib.buildSmsBody(phone, message);
    try {
      let responseBody = await HttpOutcalls.httpPostRequest(url, headers, body, httpTransform);
      let (success, msg) = SmsLib.parseFast2SmsResponse(responseBody);
      if (success) {
        smsTotalSent.val += 1;
      } else {
        smsTotalFailed.val += 1;
      };
      (success, msg);
    } catch (e) {
      smsTotalFailed.val += 1;
      (false, "Network error: could not reach Fast2SMS. Please try again.");
    };
  };

  // Internal helper used by registration flow to send SMS credentials to students
  public shared func sendSmsCredentials(phone : Text, message : Text) : async Bool {
    if (smsApiKey.val == "") {
      smsTotalFailed.val += 1;
      return false;
    };
    let url = "https://www.fast2sms.com/dev/bulkV2";
    let headers = SmsLib.buildSmsHeaders(smsApiKey.val);
    let body = SmsLib.buildSmsBody(phone, message);
    try {
      let responseBody = await HttpOutcalls.httpPostRequest(url, headers, body, httpTransform);
      let (success, _) = SmsLib.parseFast2SmsResponse(responseBody);
      if (success) {
        smsTotalSent.val += 1;
      } else {
        smsTotalFailed.val += 1;
      };
      success;
    } catch (_) {
      smsTotalFailed.val += 1;
      false;
    };
  };

  public query func getSmsStats() : async { total_sent : Nat; total_failed : Nat; api_key_set : Bool } {
    {
      total_sent = smsTotalSent.val;
      total_failed = smsTotalFailed.val;
      api_key_set = smsApiKey.val != "";
    };
  };
};
