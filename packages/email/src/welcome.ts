import { sendEmail } from "./service";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates";

interface WelcomeEmailOptions {
  userId: string;
  userEmail: string;
  userName: string;
}

export async function sendWelcomeEmail(options: WelcomeEmailOptions) {
  const html = getWelcomeEmailHtml({ userName: options.userName });
  const text = getWelcomeEmailText({ userName: options.userName });

  return sendEmail({
    userId: options.userId,
    to: options.userEmail,
    subject: "Welcome to Arcade-Vibe!",
    emailType: "welcome",
    html,
    text,
    idempotencyKey: `welcome/${options.userId}`,
  });
}
