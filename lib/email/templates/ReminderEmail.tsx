import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { ReminderData } from "../emailService";

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#1a1a1a",
  padding: "17px 0 0",
};

const alertBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "0 8px 8px 0",
  padding: "16px",
  marginBottom: "24px",
};

const alertText = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#92400e",
  margin: "0",
};

const detailsBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const detailRow = {
  marginBottom: "12px",
};

const detailLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#666666",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const detailValue = {
  fontSize: "16px",
  color: "#1a1a1a",
  margin: "0",
};

const actionButton = {
  display: "inline-block",
  backgroundColor: "#1a56db",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  marginRight: "12px",
};

const secondaryButton = {
  display: "inline-block",
  backgroundColor: "#ffffff",
  color: "#1a56db",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  border: "1px solid #1a56db",
};

const footer = {
  fontSize: "12px",
  color: "#8898aa",
  marginTop: "32px",
  textAlign: "center" as const,
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    followup: "Suivi client",
    task: "Tâche",
    event: "Événement",
  };
  return labels[type] || type;
}

export default function ReminderEmail({
  agentName,
  eventTitle,
  eventTime,
  eventType,
  clientName,
  clientPhone,
  listingTitle,
  location,
  minutesUntil,
}: ReminderData) {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const previewText = `Rappel: ${eventTitle} dans ${minutesUntil} minutes`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: "0 24px" }}>
            <Heading style={heading}>Rappel</Heading>

            {/* Alert Box */}
            <Section style={alertBox}>
              <Text style={alertText}>
                {eventTitle} commence dans {minutesUntil} minutes
              </Text>
            </Section>

            {/* Event Details */}
            <Section style={detailsBox}>
              <div style={detailRow}>
                <Text style={detailLabel}>Type</Text>
                <Text style={detailValue}>{getTypeLabel(eventType)}</Text>
              </div>

              <div style={detailRow}>
                <Text style={detailLabel}>Heure</Text>
                <Text style={detailValue}>{eventTime}</Text>
              </div>

              {clientName && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Client</Text>
                  <Text style={detailValue}>{clientName}</Text>
                </div>
              )}

              {clientPhone && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Téléphone</Text>
                  <Text style={detailValue}>
                    <Link
                      href={`tel:${clientPhone}`}
                      style={{ color: "#1a56db" }}
                    >
                      {clientPhone}
                    </Link>
                  </Text>
                </div>
              )}

              {listingTitle && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Bien</Text>
                  <Text style={detailValue}>{listingTitle}</Text>
                </div>
              )}

              {location && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Lieu</Text>
                  <Text style={detailValue}>{location}</Text>
                </div>
              )}
            </Section>

            {/* Action Buttons */}
            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Link
                href={`${dashboardUrl}/dashboard/schedule`}
                style={actionButton}
              >
                Voir mon planning
              </Link>
              {clientPhone && (
                <Link
                  href={`https://wa.me/${clientPhone.replace(/\D/g, "")}`}
                  style={secondaryButton}
                >
                  WhatsApp
                </Link>
              )}
            </Section>

            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

            <Text style={footer}>
              Bonjour {agentName},
              <br />
              <br />
              Pyramide Immobilier
              <br />
              Cet email a été envoyé automatiquement. Ne pas répondre.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
