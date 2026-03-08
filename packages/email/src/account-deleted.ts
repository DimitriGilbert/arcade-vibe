import { sendEmail, type EmailUser, type SendEmailResult } from "./service";
import { renderEmail } from "./templates/index";

interface AccountDeletedEmailOptions {
  userId: string;
  userEmail: string;
  userName: string;
  deletedAt: Date;
}

export async function sendAccountDeletedEmail(
  options: AccountDeletedEmailOptions,
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
    templateId: "accountDeleted",
    user,
    variables: {
      deletedAt: options.deletedAt,
    },
  });

  return sendEmail({
    userId: options.userId,
    to: options.userEmail,
    subject: "Your Arcade-Vibe Account Has Been Deleted",
    emailType: "account_deleted",
    html: rendered.html,
    text: rendered.text,
    templateId: "accountDeleted",
    user,
    templateVariables: {
      deletedAt: options.deletedAt.toISOString(),
    },
    idempotencyKey: `account_deleted/${options.userId}/${options.deletedAt.getTime()}`,
  });
}
