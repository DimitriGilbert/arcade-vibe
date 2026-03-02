import { render } from "@react-email/render";
import type { ReactElement, ReactNode } from "react";
import { WelcomeEmail } from "./welcome-email";
import { BroadcastEmail } from "./broadcast-email";
import { CustomEmail } from "./custom-email";
import type { EmailUser } from "./types";

export type EmailTemplateId = "welcome" | "broadcast" | "custom";

export { type EmailUser } from "./types";

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "url";
  required?: boolean;
  defaultValue?: string | number;
}

export interface TemplateDefinition {
  id: EmailTemplateId;
  name: string;
  description: string;
  userVariables: string[];
  templateVariables: TemplateVariable[];
  component: (props: { user: EmailUser; [key: string]: unknown }) => ReactElement;
}

export const EMAIL_TEMPLATES: Record<EmailTemplateId, TemplateDefinition> = {
  welcome: {
    id: "welcome",
    name: "Welcome Email",
    description: "Sent to new users when they sign up",
    userVariables: ["name", "email", "credits"],
    templateVariables: [
      { name: "credits", label: "Initial Credits", type: "number", defaultValue: 20 },
    ],
    component: (props) => WelcomeEmail({ user: props.user, credits: props.credits as number | undefined }),
  },
  broadcast: {
    id: "broadcast",
    name: "Broadcast Email",
    description: "Send announcements and updates to users",
    userVariables: ["name", "email", "credits", "reputation", "role"],
    templateVariables: [
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "content", label: "Content", type: "text", required: true },
      { name: "ctaText", label: "Button Text", type: "text" },
      { name: "ctaUrl", label: "Button URL", type: "url" },
    ],
    component: (props) => BroadcastEmail({
      user: props.user,
      subject: props.subject as string,
      content: (props.content ?? "") as ReactNode,
      ctaText: props.ctaText as string | undefined,
      ctaUrl: props.ctaUrl as string | undefined,
    }),
  },
  custom: {
    id: "custom",
    name: "Custom Email",
    description: "Compose a custom email with HTML content. Use {{user.name}}, {{user.email}}, {{user.credits}}, etc.",
    userVariables: ["name", "email", "credits", "reputation", "role", "gameCount", "promptCount", "creditSpent"],
    templateVariables: [
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "contentHtml", label: "HTML Content", type: "text", required: true },
    ],
    component: (props) => CustomEmail({
      user: props.user,
      subject: props.subject as string,
      contentHtml: props.contentHtml as string,
    }),
  },
} as const;

export function getTemplateDefinition(templateId: EmailTemplateId): TemplateDefinition | undefined {
  return EMAIL_TEMPLATES[templateId];
}

export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(EMAIL_TEMPLATES);
}

export interface RenderEmailOptions {
  templateId: EmailTemplateId;
  user: EmailUser;
  variables?: Record<string, unknown>;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export async function renderEmail(options: RenderEmailOptions): Promise<RenderedEmail> {
  const template = getTemplateDefinition(options.templateId);
  if (!template) {
    throw new Error(`Unknown template: ${options.templateId}`);
  }

  const element = template.component({ user: options.user, ...options.variables });
  const html = await render(element, { pretty: true });
  const text = await render(element, { plainText: true });

  return { html, text };
}

export { WelcomeEmail, BroadcastEmail, CustomEmail };
