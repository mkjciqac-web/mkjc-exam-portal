import HttpOutcalls "mo:caffeineai-http-outcalls/outcall";

module {
  public func buildSmsBody(phone : Text, message : Text) : Text {
    "sender_id=FSTSMS&message=" # message # "&language=english&route=p&numbers=" # phone;
  };

  public func buildSmsHeaders(apiKey : Text) : [HttpOutcalls.Header] {
    [
      { name = "authorization"; value = apiKey },
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
    ];
  };
};
