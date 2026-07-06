export interface Msg91WidgetConfig {
  widgetId: string;
  tokenAuth: string;
  identifier?: string;
  exposeMethods?: boolean;
  /** DOM id of a container element to render the widget's captcha step into, if enabled. */
  captchaRenderId?: string;
  success?: (data: { message: string }) => void;
  failure?: (error: { message: string }) => void;
}

export interface Msg91WidgetCallback {
  (data: { message: string }): void;
}

declare global {
  interface Window {
    initSendOTP?: (config: Msg91WidgetConfig) => void;
    sendOtp?: (
      identifier: string,
      onSuccess?: Msg91WidgetCallback,
      onFailure?: Msg91WidgetCallback,
    ) => void;
    verifyOtp?: (
      otp: string,
      onSuccess?: Msg91WidgetCallback,
      onFailure?: Msg91WidgetCallback,
      reqId?: string,
    ) => void;
    retryOtp?: (
      channel: string | null,
      onSuccess?: Msg91WidgetCallback,
      onFailure?: Msg91WidgetCallback,
      reqId?: string,
    ) => void;
    /** Present only when the widget's captcha step is enabled; absent otherwise. */
    isCaptchaVerified?: () => boolean;
  }
}
