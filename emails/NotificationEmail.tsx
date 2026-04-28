import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type Props = {
  recipientName: string;
  title: string;
  body: string;
  link?: string;
  baseUrl: string;
};

export default function NotificationEmail({
  recipientName,
  title,
  body,
  link,
  baseUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Pyramide Immobilier</Heading>
          <Hr style={hr} />
          <Section style={section}>
            <Text style={greeting}>Bonjour {recipientName},</Text>
            <Heading as="h2" style={eventTitle}>
              {title}
            </Heading>
            <Text style={bodyText}>{body}</Text>
            {link && (
              <Section style={buttonSection}>
                <Button href={`${baseUrl}${link}`} style={button}>
                  Voir les détails
                </Button>
              </Section>
            )}
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Pyramide Immobilier · Oran, Algérie
            <br />
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  borderRadius: "8px",
  maxWidth: "560px",
  border: "1px solid #e6ebf1",
};

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1a1a2e",
  margin: "0 0 16px",
};

const section: React.CSSProperties = {
  padding: "16px 0",
};

const greeting: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 12px",
};

const eventTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px",
};

const bodyText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#e6ebf1",
  margin: "16px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  lineHeight: "1.6",
};
