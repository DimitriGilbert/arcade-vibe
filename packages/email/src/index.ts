export {
  sendEmail,
  sendBatchEmails,
  getAvailableTemplates,
  renderEmail,
} from "./service";
export type {
  SendEmailOptions,
  SendEmailResult,
  EmailTemplateId,
  TemplateDefinition,
} from "./service";
export {
  EMAIL_TEMPLATES,
  getTemplateDefinition,
  getAllTemplates,
  WelcomeEmail,
  BroadcastEmail,
  CustomEmail,
  ResetPasswordEmail,
  ForgotPasswordEmail,
  AccountDeletedEmail,
} from "./templates/index";
export type {
  TemplateVariable,
  RenderEmailOptions,
  RenderedEmail,
  EmailUser,
} from "./templates/index";
export { sendWelcomeEmail } from "./welcome";
export { sendForgotPasswordEmail } from "./forgot-password";
export { sendResetPasswordConfirmationEmail } from "./reset-password";
export { sendAccountDeletedEmail } from "./account-deleted";
