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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EmailConfirmationProps {
  userEmail: string;
  userName?: string;
  confirmationLink: string;
}

export const EmailConfirmationEmail = ({
  userEmail,
  userName,
  confirmationLink,
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Confirm your Graysen Legal Assistant account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Graysen Legal Assistant! 🎉</Heading>
        
        <Text style={text}>
          Hello {userName || userEmail},
        </Text>
        
        <Text style={text}>
          Thank you for signing up! We're excited to have you join our AI-powered legal research platform 
          designed specifically for UAE legal professionals.
        </Text>
        
        <Text style={text}>
          To get started, please confirm your email address by clicking the button below:
        </Text>
        
        <Section style={buttonContainer}>
          <Link href={confirmationLink} style={button}>
            Confirm Email Address
          </Link>
        </Section>
        
        <Section style={featuresBox}>
          <Text style={featuresHeading}>What you can do with Graysen:</Text>
          <Text style={featureItem}>✓ AI-powered legal research using UAE legal sources</Text>
          <Text style={featureItem}>✓ Generate professional legal letters in minutes</Text>
          <Text style={featureItem}>✓ Digital signatures with full legal compliance</Text>
          <Text style={featureItem}>✓ OCR document processing for Arabic & English</Text>
          <Text style={featureItem}>✓ Template marketplace with expert-created documents</Text>
        </Section>
        
        <Text style={text}>
          If you didn't create an account with Graysen, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          Best regards,
          <br />
          <strong>Graysen Legal Assistant Team</strong>
        </Text>
        
        <Text style={disclaimer}>
          If the button above doesn't work, copy and paste this link into your browser:
          <br />
          <Link href={confirmationLink} style={linkText}>
            {confirmationLink}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EmailConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  margin: '0 auto',
  padding: '40px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const featuresBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  margin: '32px 0',
  padding: '24px',
};

const featuresHeading = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const featureItem = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const footer = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 16px',
};

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '24px 0 0',
  borderTop: '1px solid #e6e6e6',
  paddingTop: '24px',
};

const linkText = {
  color: '#16a34a',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};
