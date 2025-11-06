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

interface PasswordResetEmailProps {
  userEmail: string;
  userName?: string;
  resetLink: string;
  expiryHours?: number;
}

export const PasswordResetEmail = ({
  userEmail,
  userName,
  resetLink,
  expiryHours = 1,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Graysen Legal Assistant password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hello {userName || userEmail},
        </Text>
        
        <Text style={text}>
          We received a request to reset the password for your Graysen Legal Assistant account.
        </Text>
        
        <Section style={buttonContainer}>
          <Link href={resetLink} style={button}>
            Reset Password
          </Link>
        </Section>
        
        <Text style={text}>
          This password reset link will expire in <strong>{expiryHours} hour{expiryHours > 1 ? 's' : ''}</strong>.
        </Text>
        
        <Text style={text}>
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will remain unchanged.
        </Text>
        
        <Text style={securityNote}>
          🔒 <strong>Security tip:</strong> Never share this link with anyone. 
          Our team will never ask for your password.
        </Text>
        
        <Text style={footer}>
          Best regards,
          <br />
          <strong>Graysen Legal Assistant Team</strong>
        </Text>
        
        <Text style={disclaimer}>
          If the button above doesn't work, copy and paste this link into your browser:
          <br />
          <Link href={resetLink} style={linkText}>
            {resetLink}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

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
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const securityNote = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '6px',
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0',
  padding: '12px 16px',
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
  color: '#2563eb',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};
