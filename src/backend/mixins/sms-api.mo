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

  public shared func sendTestSms(phone : Text, message : Text) : async Bool {
    if (smsApiKey.val == "") {
      smsTotalFailed.val += 1;
      return false;
    };
    let url = "https://www.fast2sms.com/dev/bulkV2";
    let headers = SmsLib.buildSmsHeaders(smsApiKey.val);
    let body = SmsLib.buildSmsBody(phone, message);
    try {
      let _response = await HttpOutcalls.httpPostRequest(url, headers, body, httpTransform);
      smsTotalSent.val += 1;
      true;
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
