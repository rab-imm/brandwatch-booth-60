import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface SignatureRequestEmailProps {
  recipientName: string;
  senderName: string;
  documentTitle: string;
  message?: string;
  signingUrl: string;
  expiresAt?: string;
}

export const SignatureRequestEmail = ({
  recipientName,
  senderName,
  documentTitle,
  message,
  signingUrl,
  expiresAt,
}: SignatureRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>You have a document to sign from {senderName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Signature Request</Heading>
        
        <Text style={text}>Hello {recipientName},</Text>
        
        <Text style={text}>
          {senderName} has sent you a document that requires your signature:
        </Text>
        
        <Section style={documentSection}>
          <Text style={documentTitle}>{documentTitle}</Text>
        </Section>
        
        {message && (
          <Section style={messageSection}>
            <Text style={messageText}>{message}</Text>
          </Section>
        )}
        
        <Section style={buttonSection}>
          <Link href={signingUrl} style={button}>
            Review and Sign Document
          </Link>
        </Section>
        
        {expiresAt && (
          <Text style={expiryText}>
            This signature request expires on {new Date(expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}
        
        <Text style={footer}>
          If you have any questions about this document, please contact {senderName} directly.
        </Text>
        
        <Text style={disclaimer}>
          This is an automated message. Please do not reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignatureRequestEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};

const documentSection = {
  padding: "24px 48px",
  backgroundColor: "#f9fafb",
  margin: "24px 0",
};

const documentTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const messageSection = {
  padding: "24px 48px",
  backgroundColor: "#eff6ff",
  margin: "24px 0",
  borderLeft: "4px solid #3b82f6",
};

const messageText = {
  color: "#1e40af",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  fontStyle: "italic",
};

const buttonSection = {
  padding: "24px 48px",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 32px",
};

const expiryText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 48px",
  marginTop: "16px",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 48px",
  marginTop: "32px",
};

const disclaimer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 48px",
  marginTop: "16px",
};
