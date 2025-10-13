import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface LetterShareEmailProps {
  recipientName: string
  senderName: string
  letterTitle: string
  shareLink: string
  expiresAt?: string
  isPasswordProtected: boolean
  maxViews?: number
  message?: string
}

export const LetterShareEmail = ({
  recipientName,
  senderName,
  letterTitle,
  shareLink,
  expiresAt,
  isPasswordProtected,
  maxViews,
  message,
}: LetterShareEmailProps) => (
  <Html>
    <Head />
    <Preview>{senderName} has shared a legal document with you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Legal Document Shared</Heading>
        
        <Text style={text}>Dear {recipientName},</Text>
        
        <Text style={text}>
          {senderName} has shared a legal document with you through UAE Legal Assistant.
        </Text>

        <Section style={documentBox}>
          <Text style={documentTitle}>{letterTitle}</Text>
          {message && (
            <Text style={messageText}>{message}</Text>
          )}
        </Section>

        <Section style={buttonContainer}>
          <Link href={shareLink} style={button}>
            View Document
          </Link>
        </Section>

        {(expiresAt || isPasswordProtected || maxViews) && (
          <>
            <Hr style={hr} />
            <Section style={infoBox}>
              <Text style={infoTitle}>Important Information:</Text>
              {expiresAt && (
                <Text style={infoItem}>
                  • This link expires on {new Date(expiresAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              )}
              {isPasswordProtected && (
                <Text style={infoItem}>
                  • This document is password protected. Please contact {senderName} for the password.
                </Text>
              )}
              {maxViews && (
                <Text style={infoItem}>
                  • This link can be viewed up to {maxViews} time{maxViews > 1 ? 's' : ''}
                </Text>
              )}
            </Section>
          </>
        )}

        <Hr style={hr} />

        <Section style={disclaimerBox}>
          <Text style={disclaimerTitle}>Legal Disclaimer</Text>
          <Text style={disclaimerText}>
            This document is provided for informational purposes only and does not constitute legal advice. 
            For specific legal matters, please consult with a qualified UAE lawyer.
          </Text>
        </Section>

        <Text style={footer}>
          This email was sent by UAE Legal Assistant on behalf of {senderName}.
          <br />
          If you believe you received this email in error, please contact the sender directly.
        </Text>

        <Text style={footerBrand}>
          <Link href="https://uaelegalassistant.com" style={footerLink}>
            UAE Legal Assistant
          </Link>
          {' • Secure Document Sharing'}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default LetterShareEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
}

const documentBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  margin: '24px 40px',
  padding: '24px',
}

const documentTitle = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const messageText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
  fontStyle: 'italic',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 40px',
}

const infoBox = {
  padding: '0 40px',
}

const infoTitle = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const infoItem = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const disclaimerBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
  border: '1px solid #fde68a',
  margin: '24px 40px',
  padding: '16px 20px',
}

const disclaimerTitle = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const disclaimerText = {
  color: '#78350f',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
}

const footer = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
}

const footerBrand = {
  color: '#94a3b8',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footerLink = {
  color: '#2563eb',
  textDecoration: 'none',
}
