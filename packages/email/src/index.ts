export { sendEmail, sendBatchEmails } from "./service";
export type { SendEmailOptions, SendEmailResult } from "./service";
export {
  getWelcomeEmailHtml,
  getWelcomeEmailText,
  getBroadcastEmailHtml,
} from "./templates";
export { sendWelcomeEmail } from "./welcome";
