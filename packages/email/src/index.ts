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
} from "./templates/index";
export type {
  TemplateVariable,
  RenderEmailOptions,
  RenderedEmail,
  EmailUser,
} from "./templates/index";
export { sendWelcomeEmail } from "./welcome";
