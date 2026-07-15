import { Resend } from 'resend';
import { env } from '../config';
import { logger } from '../utils/logger';

const RESET_TTL_MINUTES = 60;

export class EmailService {
  private client: Resend | null = null;

  private getClient(): Resend {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    if (!this.client) {
      this.client = new Resend(env.RESEND_API_KEY);
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(env.RESEND_API_KEY?.trim());
  }

  async sendPasswordResetEmail(input: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<void> {
    const subject = 'Planora — Reset your password / بازنشانی رمز عبور';
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h2 style="margin:0 0 12px;">Planora</h2>
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>We received a request to reset your password. Click the button below (valid for ${RESET_TTL_MINUTES} minutes):</p>
        <p style="margin:24px 0;">
          <a href="${input.resetUrl}"
             style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="word-break:break-all;font-size:13px;color:#4b5563;">
          Or open this link:<br/>${escapeHtml(input.resetUrl)}
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p dir="rtl" style="text-align:right;">سلام ${escapeHtml(input.name)}،</p>
        <p dir="rtl" style="text-align:right;">
          درخواست بازنشانی رمز عبور برای حساب شما ثبت شده است. روی دکمه زیر کلیک کنید
          (این لینک ${RESET_TTL_MINUTES} دقیقه معتبر است):
        </p>
        <p dir="rtl" style="text-align:right;margin:24px 0;">
          <a href="${input.resetUrl}"
             style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
            بازنشانی رمز عبور
          </a>
        </p>
        <p style="font-size:13px;color:#6b7280;">
          If you did not request this, you can ignore this email.<br/>
          اگر این درخواست از سمت شما نبوده، این ایمیل را نادیده بگیرید.
        </p>
      </div>
    `;

    const { error } = await this.getClient().emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject,
      html,
    });

    if (error) {
      logger.error('Resend password-reset email failed', {
        to: input.to,
        error,
      });
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const emailService = new EmailService();
export const PASSWORD_RESET_TTL_MS = RESET_TTL_MINUTES * 60 * 1000;
