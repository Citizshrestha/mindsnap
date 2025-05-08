import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const mailOptions = {
  from: process.env.SENDER_EMAIL,
  to: 'test@lamk.com',
  subject: 'Test Email from Brevo',
  text: 'This is a test email to verify SMTP credentials.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Test email error:', {
      message: error.message,
      code: error.code,
      response: error.response || 'No response',
    });
  } else {
    console.log('✅ Test email sent:', info);
  }
});