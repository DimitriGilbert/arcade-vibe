import { sendEmail, type EmailUser, type SendEmailResult } from "./service";
import { renderEmail } from "./templates/index";

interface ResetPasswordConfirmationEmailOptions {
  userId: string;
  userEmail: string;
  userName: string;
  resetToken: string;
  resetLink: string;
}

export async function sendResetPasswordConfirmationEmail(
  options: ResetPasswordConfirmationEmailOptions,
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
    templateId: "resetPassword",
    user,
    variables: {
      resetLink: options.resetLink,
      resetToken: options.resetToken,
    },
  });

  return sendEmail({
    userId: options.userId,
    to: options.userEmail,
    subject: "Your Password Has Been Reset",
    emailType: "reset_password_confirmation",
    html: rendered.html,
    text: rendered.text,
    templateId: "resetPassword",
    user,
    templateVariables: {
      resetLink: options.resetLink,
      resetToken: options.resetToken,
    },
    idempotencyKey: `reset_password_confirmation/${options.userId}/${options.resetToken}`,
  });
}
