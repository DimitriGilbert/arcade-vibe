import { Resend } from "resend";
import { env } from "@arcade-vibe/env/server";
import { db } from "@arcade-vibe/db";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { randomUUID } from "node:crypto";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  userId: string;
  to: string;
  subject: string;
  emailType: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateVariables?: Record<string, string | number>;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  resendId?: string;
  error?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const idempotencyKey =
    options.idempotencyKey ??
    `${options.emailType}/${options.userId}/${Date.now()}`;
  const emailId = randomUUID();

  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  if (!resend) {
    await db.insert(emailLogs).values({
      id: emailId,
      userId: options.userId,
      emailType: options.emailType,
      status: "failed",
      subject: options.subject,
      fromEmail: env.RESEND_FROM_EMAIL,
      toEmail: options.to,
      htmlContent: options.html,
      textContent: options.text,
      templateId: options.templateId,
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

    if (options.templateId) {
      const result = await resend.emails.send(
        {
          from,
          to: [options.to],
          subject: options.subject,
          template: {
            id: options.templateId,
            variables: options.templateVariables ?? {},
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
          html: options.html ?? "",
          ...(options.text && { text: options.text }),
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
        htmlContent: options.html,
        textContent: options.text,
        templateId: options.templateId,
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
      htmlContent: options.html,
      textContent: options.text,
      templateId: options.templateId,
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
      htmlContent: options.html,
      textContent: options.text,
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
