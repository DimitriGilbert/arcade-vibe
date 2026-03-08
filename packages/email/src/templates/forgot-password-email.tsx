import { Section, Text, Button, Hr, Heading, Link } from "@react-email/components";
import type { ReactElement } from "react";
import { BaseLayout } from "./base-layout";
import type { EmailUser } from "./types";

export interface ForgotPasswordEmailProps {
  user: EmailUser;
  resetLink: string;
  resetToken: string;
}

export function ForgotPasswordEmail({ user, resetLink }: ForgotPasswordEmailProps): ReactElement {
  const userName = user.name ?? "there";

  return (
    <BaseLayout previewText={`Reset your Arcade-Vibe password`}>
      <Heading style={h1}>Forgot Your Password?</Heading>
      <Text style={text}>
        Hi {userName},
      </Text>
      <Text style={text}>
        No worries! It happens to the best of us. We received a request to reset 
        the password for your Arcade-Vibe account. Click the button below to 
        set up a new password:
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Set New Password
        </Button>
      </Section>
      <Text style={text}>
        Or copy and paste this link into your browser:
      </Text>
      <Text style={linkText}>{resetLink}</Text>
      <Hr style={divider} />
      <Text style={warning}>
        This link will expire in <strong>24 hours</strong>. If you didn&apos;t forget 
        your password, you can safely ignore this email — your password will remain unchanged.
      </Text>
      <Hr style={divider} />
      <Text style={support}>
        Need help? Contact our support team at{" "}
        <Link href="mailto:support@arcade-vibe.com" style={supportLink}>
          support@arcade-vibe.com
        </Link>
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

const linkText = {
  color: "#a855f7",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 20px",
  wordBreak: "break-all" as const,
};

const divider = {
  borderColor: "#333333",
  margin: "20px 0",
};

const warning = {
  color: "#f59e0b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const support = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  textAlign: "center" as const,
};

const supportLink = {
  color: "#a855f7",
  textDecoration: "none",
};
