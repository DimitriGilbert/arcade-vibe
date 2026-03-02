import { Section, Text, Button, Hr, Heading } from "@react-email/components";
import type { ReactElement } from "react";
import { BaseLayout } from "./base-layout";
import type { EmailUser } from "./types";

export interface WelcomeEmailProps {
  user: EmailUser;
  credits?: number;
}

export function WelcomeEmail({ user, credits }: WelcomeEmailProps): ReactElement {
  const initialCredits = credits ?? user.credits;
  const userName = user.name ?? "there";

  return (
    <BaseLayout previewText={`Welcome to Arcade-Vibe, ${userName}!`}>
      <Heading style={h1}>Welcome to Arcade-Vibe, {userName}!</Heading>
      <Text style={text}>
        Thanks for joining our community of game creators. You're now ready to:
      </Text>
      <Section style={list}>
        <Text style={listItem}>Create AI-powered games from prompts</Text>
        <Text style={listItem}>Participate in weekly game jams</Text>
        <Text style={listItem}>Compete on the leaderboard</Text>
        <Text style={listItem}>Rate and discover amazing games</Text>
      </Section>
      <Hr style={divider} />
      <Text style={highlight}>
        You've been granted <strong>{initialCredits} free credits</strong> to get started. Use them
        wisely!
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href="https://arcade-vibe.com">
          Start Creating
        </Button>
      </Section>
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

const highlight = {
  color: "#a855f7",
  fontSize: "18px",
  lineHeight: "28px",
  margin: "0 0 20px",
  textAlign: "center" as const,
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
