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

interface MagicLinkEmailProps {
  userEmail: string;
  userName?: string;
  magicLink: string;
  expiryMinutes?: number;
}

export const MagicLinkEmail = ({
  userEmail,
  userName,
  magicLink,
  expiryMinutes = 60,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your magic link to sign in to Graysen Legal Assistant</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sign In to Graysen</Heading>
        
        <Text style={text}>
          Hello {userName || userEmail},
        </Text>
        
        <Text style={text}>
          Click the button below to securely sign in to your Graysen Legal Assistant account. 
          No password required!
        </Text>
        
        <Section style={buttonContainer}>
          <Link href={magicLink} style={button}>
            Sign In with Magic Link
          </Link>
        </Section>
        
        <Text style={text}>
          This link will expire in <strong>{expiryMinutes} minutes</strong> and can only be used once.
        </Text>
        
        <Text style={securityNote}>
          🔒 <strong>Security tip:</strong> This link is unique to you. Never share it with anyone, 
          including Graysen team members.
        </Text>
        
        <Text style={text}>
          If you didn't request this sign-in link, you can safely ignore this email. 
          Someone may have accidentally entered your email address.
        </Text>
        
        <Text style={footer}>
          Best regards,
          <br />
          <strong>Graysen Legal Assistant Team</strong>
        </Text>
        
        <Text style={disclaimer}>
          If the button above doesn't work, copy and paste this link into your browser:
          <br />
          <Link href={magicLink} style={linkText}>
            {magicLink}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

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
  backgroundColor: '#7c3aed',
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
  color: '#7c3aed',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};
