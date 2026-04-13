declare module "africastalking" {
  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }
  interface SMSRecipient {
    status: string;
    number: string;
    cost: string;
    messageId: string;
  }
  interface SMSSendResult {
    SMSMessageData: {
      Message: string;
      Recipients: SMSRecipient[];
    };
  }
  interface SMSService {
    send(options: SMSSendOptions): Promise<SMSSendResult>;
  }
  interface AfricasTalkingInstance {
    SMS: SMSService;
  }
  function AfricasTalking(options: { apiKey: string; username: string }): AfricasTalkingInstance;
  export = AfricasTalking;
}
