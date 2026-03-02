import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import type { ReactElement, ReactNode } from "react";

export interface BaseLayoutProps {
  children: ReactNode;
  previewText?: string;
}

export function BaseLayout({ children, previewText }: BaseLayoutProps): ReactElement {
  return (
    <Html>
      <Head />
      {previewText && <Text style={preview}>{previewText}</Text>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandName}>Arcade-Vibe</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://arcade-vibe.com" style={footerLink}>
                Arcade-Vibe
              </Link>{" "}
              — Create AI-powered games from prompts
            </Text>
            <Text style={footerText}>
              <Link href="https://arcade-vibe.com/settings/notifications" style={footerLink}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const preview = {
  display: "none" as const,
};

const main = {
  backgroundColor: "#0f0f0f",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: "#1a1a1a",
  margin: "0 auto",
  padding: "0 20px",
  borderRadius: "12px",
  maxWidth: "600px",
};

const header = {
  padding: "30px 0 20px",
  textAlign: "center" as const,
};

const brandName = {
  color: "#a855f7",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "0 30px 30px",
};

const divider = {
  borderColor: "#333333",
  margin: "0",
};

const footer = {
  padding: "20px 30px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666666",
  fontSize: "14px",
  margin: "5px 0",
};

const footerLink = {
  color: "#a855f7",
  textDecoration: "none",
};
