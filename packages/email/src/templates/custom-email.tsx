import { Section, Text, Heading } from "@react-email/components";
import type { ReactElement } from "react";
import { BaseLayout } from "./base-layout";
import type { EmailUser } from "./types";

export interface CustomEmailProps {
  user: EmailUser;
  subject: string;
  contentHtml: string;
}

function interpolateUserVariables(html: string, user: EmailUser): string {
  let result = html;
  const userKey = "user" as const;
  
  for (const [key, value] of Object.entries(user)) {
    const placeholder = `{{${userKey}.${key}}}`;
    const strValue = value === null ? "" : String(value);
    result = result.replaceAll(placeholder, strValue);
  }
  
  return result;
}

export function CustomEmail({ user, subject, contentHtml }: CustomEmailProps): ReactElement {
  const userName = user.name ?? "there";
  const processedHtml = interpolateUserVariables(contentHtml, user);

  return (
    <BaseLayout previewText={subject}>
      <Text style={greeting}>Hi {userName},</Text>
      <Heading style={h1}>{subject}</Heading>
      <Section style={contentSection}>
        <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      </Section>
    </BaseLayout>
  );
}

const greeting = {
  color: "#cccccc",
  fontSize: "16px",
  margin: "0 0 10px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
};

const contentSection = {
  margin: "0 0 20px",
};
