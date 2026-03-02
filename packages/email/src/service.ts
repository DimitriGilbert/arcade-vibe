import { Resend } from "resend";
import { env } from "@arcade-vibe/env/server";
import { db } from "@arcade-vibe/db";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { randomUUID } from "node:crypto";
import {
  renderEmail,
  type EmailTemplateId,
  type TemplateDefinition,
  type EmailUser,
  getAllTemplates,
} from "./templates/index";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  userId: string;
  to: string;
  subject: string;
  emailType: string;
  html?: string;
  text?: string;
  templateId?: EmailTemplateId;
  user?: EmailUser;
  templateVariables?: Record<string, unknown>;
  resendTemplateId?: string;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  resendId?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const idempotencyKey =
    options.idempotencyKey ??
    `${options.emailType}/${options.userId}/${Date.now()}`;
  const emailId = randomUUID();

  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  let html = options.html;
  let text = options.text;

  if (options.templateId && options.user) {
    try {
      const rendered = await renderEmail({
        templateId: options.templateId,
        user: options.user,
        variables: options.templateVariables,
      });
      html = rendered.html;
      text = rendered.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to render template";
      await db.insert(emailLogs).values({
        id: emailId,
        userId: options.userId,
        emailType: options.emailType,
        status: "failed",
        subject: options.subject,
        fromEmail: env.RESEND_FROM_EMAIL,
        toEmail: options.to,
        htmlContent: html,
        textContent: text,
        templateId: options.resendTemplateId,
        templateVariables: options.templateVariables,
        idempotencyKey,
        errorMessage,
      });

      return { success: false, emailId, error: errorMessage };
    }
  }

  if (!resend) {
    await db.insert(emailLogs).values({
      id: emailId,
      userId: options.userId,
      emailType: options.emailType,
      status: "failed",
      subject: options.subject,
      fromEmail: env.RESEND_FROM_EMAIL,
      toEmail: options.to,
      htmlContent: html,
      textContent: text,
      templateId: options.resendTemplateId,
      templateVariables: options.templateVariables,
      idempotencyKey,
      errorMessage: "RESEND_API_KEY not configured",
    });

    return {
      success: false,
      emailId,
      error: "RESEND_API_KEY not configured",
    };
  }

  try {
    let data: { id: string } | null = null;
    let error: { message: string } | null = null;

    if (options.resendTemplateId) {
      const result = await resend.emails.send(
        {
          from,
          to: [options.to],
          subject: options.subject,
          template: {
            id: options.resendTemplateId,
            variables: (options.templateVariables as Record<string, string | number>) ?? {},
          },
          tags: [
            { name: "user_id", value: options.userId },
            { name: "email_type", value: options.emailType },
          ],
        },
        { idempotencyKey },
      );
      data = result.data;
      error = result.error;
    } else {
      const result = await resend.emails.send(
        {
          from,
          to: [options.to],
          subject: options.subject,
          html: html ?? "",
          ...(text && { text }),
          tags: [
            { name: "user_id", value: options.userId },
            { name: "email_type", value: options.emailType },
          ],
        },
        { idempotencyKey },
      );
      data = result.data;
      error = result.error;
    }

    if (error) {
      await db.insert(emailLogs).values({
        id: emailId,
        userId: options.userId,
        emailType: options.emailType,
        status: "failed",
        subject: options.subject,
        fromEmail: env.RESEND_FROM_EMAIL,
        toEmail: options.to,
        htmlContent: html,
        textContent: text,
        templateId: options.resendTemplateId,
        templateVariables: options.templateVariables,
        idempotencyKey,
        errorMessage: error.message,
      });

      return { success: false, emailId, error: error.message };
    }

    await db.insert(emailLogs).values({
      id: emailId,
      userId: options.userId,
      resendId: data?.id,
      emailType: options.emailType,
      status: "sent",
      subject: options.subject,
      fromEmail: env.RESEND_FROM_EMAIL,
      toEmail: options.to,
      htmlContent: html,
      textContent: text,
      templateId: options.resendTemplateId,
      templateVariables: options.templateVariables,
      idempotencyKey,
      sentAt: new Date(),
    });

    return { success: true, emailId, resendId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await db.insert(emailLogs).values({
      id: emailId,
      userId: options.userId,
      emailType: options.emailType,
      status: "failed",
      subject: options.subject,
      fromEmail: env.RESEND_FROM_EMAIL,
      toEmail: options.to,
      htmlContent: html,
      textContent: text,
      idempotencyKey,
      errorMessage,
    });

    return { success: false, emailId, error: errorMessage };
  }
}

export async function sendBatchEmails(
  emails: Array<Omit<SendEmailOptions, "idempotencyKey">>,
  batchId: string,
): Promise<{ success: boolean; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail({
      ...email,
      idempotencyKey: `batch-${batchId}/${email.userId}`,
    });
    results.push(result);

    if (!result.success) {
      console.error(`Failed to send email to ${email.to}:`, result.error);
    }
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

export function getAvailableTemplates(): TemplateDefinition[] {
  return getAllTemplates();
}

export { renderEmail, type EmailTemplateId, type TemplateDefinition, type EmailUser };
