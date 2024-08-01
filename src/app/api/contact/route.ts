import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';


export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, subject, message } = await request.json();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', 
      port: 587,
      secure: true, 
      auth: {
        user: '',
        pass: '',
      },
    });
    const mailOptions = {
      from: 'rohit@zero8.dev',
      to: 'rohit@zero8.dev',
      subject: `Contact form submission: ${subject}`,
      text: `${email} wants to contact you through mail. Message: ${message}`,
    };

    const abc = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
