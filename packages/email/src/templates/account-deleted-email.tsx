import { Section, Text, Hr, Heading, Link } from "@react-email/components";
import type { ReactElement } from "react";
import { BaseLayout } from "./base-layout";
import type { EmailUser } from "./types";

export interface AccountDeletedEmailProps {
  user: EmailUser;
  deletedAt: Date;
}

export function AccountDeletedEmail({ user, deletedAt }: AccountDeletedEmailProps): ReactElement {
  const userName = user.name ?? "there";
  const formattedDate = deletedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <BaseLayout previewText={`Your Arcade-Vibe account has been deleted`}>
      <Heading style={h1}>Account Deleted</Heading>
      <Text style={text}>
        Hi {userName},
      </Text>
      <Text style={text}>
        This email confirms that your Arcade-Vibe account has been permanently deleted 
        on <strong>{formattedDate}</strong>.
      </Text>
      <Text style={text}>
        All of your personal data has been removed from our systems, including:
      </Text>
      <Section style={list}>
        <Text style={listItem}>Your profile information</Text>
        <Text style={listItem}>Game scores and session data</Text>
        <Text style={listItem}>Collections and favorites</Text>
        <Text style={listItem}>Credit balance and transaction history</Text>
        <Text style={listItem}>API keys and preferences</Text>
        <Text style={listItem}>Session and authentication data</Text>
      </Section>
      <Hr style={divider} />
      <Text style={warning}>
        <strong>This action cannot be undone.</strong> If you didn&apos;t request this deletion, 
        please contact our support team immediately.
      </Text>
      <Hr style={divider} />
      <Text style={support}>
        Questions or concerns? Contact us at{" "}
        <Link href="mailto:support@arcade-vibe.com" style={supportLink}>
          support@arcade-vibe.com
        </Link>
      </Text>
      <Text style={farewell}>
        Thanks for being part of our community. We hope to see you again!
      </Text>
    </BaseLayout>
  );
}

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#cccccc",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const list = {
  margin: "0 0 20px",
  paddingLeft: "20px",
};

const listItem = {
  color: "#cccccc",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "0",
};

const divider = {
  borderColor: "#333333",
  margin: "20px 0",
};

const warning = {
  color: "#ef4444",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const support = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const supportLink = {
  color: "#a855f7",
  textDecoration: "none",
};

const farewell = {
  color: "#a855f7",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};
