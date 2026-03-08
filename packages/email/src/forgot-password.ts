import { sendEmail, type EmailUser, type SendEmailResult } from "./service";
import { renderEmail } from "./templates/index";

interface ForgotPasswordEmailOptions {
  userId: string;
  userEmail: string;
  userName: string;
  resetToken: string;
  resetLink: string;
}

export async function sendForgotPasswordEmail(
  options: ForgotPasswordEmailOptions,
): Promise<SendEmailResult> {
  const user: EmailUser = {
    id: options.userId,
    name: options.userName,
    email: options.userEmail,
    role: "participant",
    credits: 0,
    reputation: 0,
    gameCount: 0,
    promptCount: 0,
    creditSpent: 0,
    createdAt: new Date(),
  };

  const rendered = await renderEmail({
    templateId: "forgotPassword",
    user,
    variables: {
      resetLink: options.resetLink,
      resetToken: options.resetToken,
    },
  });

  return sendEmail({
    userId: options.userId,
    to: options.userEmail,
    subject: "Reset Your Password",
    emailType: "forgot_password",
    html: rendered.html,
    text: rendered.text,
    templateId: "forgotPassword",
    user,
    templateVariables: {
      resetLink: options.resetLink,
      resetToken: options.resetToken,
    },
    idempotencyKey: `forgot_password/${options.userId}/${options.resetToken}`,
  });
}
