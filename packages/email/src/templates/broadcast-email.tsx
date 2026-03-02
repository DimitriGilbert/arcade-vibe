import { Section, Text, Button, Heading } from "@react-email/components";
import type { ReactElement, ReactNode } from "react";
import { BaseLayout } from "./base-layout";
import type { EmailUser } from "./types";

export interface BroadcastEmailProps {
  user: EmailUser;
  subject: string;
  content: ReactNode;
  ctaText?: string;
  ctaUrl?: string;
}

export function BroadcastEmail({
  user,
  subject,
  content,
  ctaText,
  ctaUrl,
}: BroadcastEmailProps): ReactElement {
  const userName = user.name ?? "there";

  return (
    <BaseLayout previewText={subject}>
      <Text style={greeting}>Hi {userName},</Text>
      <Heading style={h1}>{subject}</Heading>
      <Section style={contentSection}>{content}</Section>
      {ctaText && ctaUrl && (
        <Section style={buttonContainer}>
          <Button style={button} href={ctaUrl}>
            {ctaText}
          </Button>
        </Section>
      )}
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#a855f7",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
};
