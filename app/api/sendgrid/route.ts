import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';
import { z } from 'zod';

// 1. Helper function to prevent HTML Injection
const escapeHtml = (value: string) => {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 2. Define strict Zod validation schema
const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Invalid email format").max(254),
  phone: z.string().min(7, "Phone number is too short").max(20),
  message: z.string().min(1, "Message is required").max(2000),
});

export async function POST(req: Request) {
  try {
    // 3. Origin Validation (Broken Access Control Fix)
    const origin = req.headers.get("origin");
    const allowedOrigin = "https://nilvan.duckdns.org";
    
    // Only enforce Origin check in production to allow local testing
    if (process.env.NODE_ENV === 'production' && origin !== allowedOrigin) {
      return NextResponse.json({ error: "Forbidden Request Origin" }, { status: 403 });
    }

    // 4. Payload Size Limit (Application-Level DoS Fix)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) { // 10KB Limit
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json();

    // 5. Server-Side Input Validation (Insecure Design Fix)
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: parsed.error.format() }, 
        { status: 400 }
      );
    }

    // Destructure validated and sanitized data
    const { name, email, phone, message } = parsed.data;

    const apiKey = process.env.SENDGRID_API_KEY;
    const toEmail = process.env.SENDGRID_TO_EMAIL;

    if (!apiKey) {
      console.error('SENDGRID_API_KEY is not set');
      return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    if (!toEmail) {
      console.error('SENDGRID_TO_EMAIL is not set');
      return NextResponse.json({ error: 'Recipient email not configured' }, { status: 500 });
    }

    sendgrid.setApiKey(apiKey);

    const msg = {
      to: toEmail,
      from: toEmail, // Must be a verified sender in SendGrid
      subject: 'New Contact Form Submission',
      // Text versions don't execute HTML, so escaping isn't strictly necessary here, 
      // but it's good practice. SendGrid renders the HTML block if it exists.
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
      
      // 6. Apply escapeHtml() to user variables in the HTML template (HTML Injection Fix)
      html: `
        <html>
          <body style="background: #f6f6f7; padding: 40px 0;">
            <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 32px 32px 24px 32px; font-family: Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px; color: #222;">NILAVAN REALTORS</div>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <div style="font-size: 16px; color: #222; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0;">You have a new contact form submission:</p>
                <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
                <p style="margin: 0 0 8px 0;"><strong>Message:</strong> ${escapeHtml(message)}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await sendgrid.send(msg);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('SendGrid Error:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response?: { body?: unknown } };
      console.error('SendGrid Response Body:', sgError.response?.body);
    }

    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}
