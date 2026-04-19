/**
 * Email sending utility using Resend.
 * Logs every send attempt to MongoDB `email_logs` collection.
 */
import { Resend } from 'resend';
import { connectToDatabase } from './mongodb.js';
import { EMAIL_TEMPLATES, type EmailType, type TemplateData } from './email-templates.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export interface SendEmailOptions {
  type: EmailType;
  to: string;
  data?: TemplateData;
}

export interface EmailLog {
  type: EmailType;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: Date;
  isTest?: boolean;
}

export async function sendEmail({ type, to, data = {} }: SendEmailOptions, isTest = false): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    return { success: false, error: `Unknown email type: ${type}` };
  }

  const subject = template.subject;
  const html = template.html(data);

  let messageId: string | undefined;
  let error: string | undefined;
  let status: 'sent' | 'failed' = 'failed';

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (result.error) {
      error = result.error.message;
    } else {
      messageId = result.data?.id;
      status = 'sent';
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Log to MongoDB
  try {
    const { db } = await connectToDatabase();
    const log: EmailLog = {
      type,
      to,
      subject,
      status,
      sentAt: new Date(),
      isTest,
      ...(messageId ? { messageId } : {}),
      ...(error ? { error } : {}),
    };
    await db.collection('email_logs').insertOne(log);
  } catch {
    // Non-fatal — don't fail the send on log error
  }

  return status === 'sent' ? { success: true, messageId } : { success: false, error };
}
