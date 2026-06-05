import * as React from 'react';
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';

// Shared shell for every Avkash email. Inline styles only — email clients ignore
// <style>/external CSS. Keep templates thin: a heading, body children, an optional CTA.

const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: '24px 0',
  margin: 0,
};
const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px',
};
const brand = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#4f46e5',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
};
const h1 = { fontSize: '20px', fontWeight: 700, color: '#18181b', margin: '0 0 12px' };
const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '11px 20px',
  display: 'inline-block',
};
const hr = { borderColor: '#e4e4e7', margin: '24px 0 16px' };
const footer = { fontSize: '12px', color: '#a1a1aa', margin: 0 };

// Shared paragraph style — templates import this for their body <Text>.
export const para = { fontSize: '15px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' };

export interface LayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  cta?: { label: string; href: string };
}

export function Layout({ preview, heading, children, cta }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Avkash</Text>
          <Heading style={h1}>{heading}</Heading>
          {children}
          {cta ? (
            <Section style={{ margin: '8px 0 4px' }}>
              <Button href={cta.href} style={button}>
                {cta.label}
              </Button>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Avkash — HR, minus the busywork.</Text>
        </Container>
      </Body>
    </Html>
  );
}
