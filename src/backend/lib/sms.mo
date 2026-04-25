import HttpOutcalls "mo:caffeineai-http-outcalls/outcall";
import Text "mo:core/Text";

module {
  public func buildSmsBody(phone : Text, message : Text) : Text {
    "message=" # message # "&route=q&numbers=" # phone;
  };

  public func buildSmsHeaders(apiKey : Text) : [HttpOutcalls.Header] {
    [
      { name = "authorization"; value = apiKey },
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
    ];
  };

  // Parse Fast2SMS JSON response.
  // Success: {"return":true,"request_id":"...","message":["3 sms submitted successfully."]}
  // Failure: {"return":false,"message":["Invalid authorization key"]}
  // Returns (success: Bool, message: Text)
  public func parseFast2SmsResponse(responseBody : Text) : (Bool, Text) {
    // Check if the response contains "\"return\":true" to determine success
    let isSuccess = responseBody.contains(#text "\"return\":true");

    // Extract first element from the message array
    // Look for "message":["<content>"] pattern
    let msg : Text = switch (extractMessageText(responseBody)) {
      case (?m) { m };
      case null {
        if (isSuccess) { "SMS sent successfully." } else {
          "SMS delivery failed. Check API key and balance.";
        };
      };
    };

    (isSuccess, msg);
  };

  // Extract the first string from the "message" JSON array in the response
  private func extractMessageText(json : Text) : ?Text {
    // Find "message":[ and then extract the first quoted string
    let messageKey = "\"message\":[\"";
    switch (findSubstringEnd(json, messageKey)) {
      case null { null };
      case (?startIdx) {
        // Find the closing quote after the start
        let chars = json.toArray();
        var i = startIdx;
        var result = "";
        var found = false;
        label scan while (i < chars.size()) {
          let c = chars[i];
          if (c == '\u{22}') {
            found := true;
            break scan;
          };
          result := result # Text.fromChar(c);
          i += 1;
        };
        if (found or result != "") { ?result } else { null };
      };
    };
  };

  // Returns the index right after the end of the needle in haystack, or null if not found
  private func findSubstringEnd(haystack : Text, needle : Text) : ?Nat {
    let hChars = haystack.toArray();
    let nChars = needle.toArray();
    let hLen = hChars.size();
    let nLen = nChars.size();
    if (nLen == 0) { return ?0 };
    if (hLen < nLen) { return null };
    var i = 0;
    label outer while (i <= hLen - nLen) {
      var j = 0;
      var matches = true;
      label inner while (j < nLen) {
        if (hChars[i + j] != nChars[j]) {
          matches := false;
          break inner;
        };
        j += 1;
      };
      if (matches) { return ?(i + nLen) };
      i += 1;
    };
    null;
  };
};
