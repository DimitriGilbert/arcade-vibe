import { sendEmail, type EmailUser } from "./service";
import { renderEmail } from "./templates/index";

interface WelcomeEmailOptions {
  userId: string;
  userEmail: string;
  userName: string;
  credits?: number;
}

export async function sendWelcomeEmail(options: WelcomeEmailOptions) {
  const user: EmailUser = {
    id: options.userId,
    name: options.userName,
    email: options.userEmail,
    role: "participant",
    credits: options.credits ?? 20,
    reputation: 0,
    gameCount: 0,
    promptCount: 0,
    creditSpent: 0,
    createdAt: new Date(),
  };

  const rendered = await renderEmail({
    templateId: "welcome",
    user,
    variables: {
      credits: options.credits ?? 20,
    },
  });

  return sendEmail({
    userId: options.userId,
    to: options.userEmail,
    subject: "Welcome to Arcade-Vibe!",
    emailType: "welcome",
    html: rendered.html,
    text: rendered.text,
    templateId: "welcome",
    user,
    templateVariables: {
      credits: options.credits ?? 20,
    },
    idempotencyKey: `welcome/${options.userId}`,
  });
}
