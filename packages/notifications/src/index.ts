// Delivery stubs. For now everything is console.log — swap the bodies for Resend
// (email) and MSG91 (SMS) later without changing any caller. Auth wires these as
// its sendVerificationEmail / sendResetPassword / sendOTP callbacks.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  console.log(`\n📧 [email → ${msg.to}] ${msg.subject}\n${msg.text}\n`);
}

export async function sendSMS(to: string, text: string): Promise<void> {
  console.log(`\n📱 [sms → ${to}] ${text}\n`);
}
