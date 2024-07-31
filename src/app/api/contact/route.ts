import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, subject, message } = await request.json();
    console.log(email, subject, message);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '#email',
        pass: "#password",
      },
    });

    const mailOptions = {
      from: email,
      to: 'rohit@zero8.dev',
      subject: `Contact form submission: ${subject}`,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
