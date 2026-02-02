/**
 * Resend Email Provider for Magic Links
 *
 * Integrates Resend email service with @convex-dev/auth for sending
 * magic link authentication emails.
 *
 * Why Resend?
 * - Simple API (single SDK import)
 * - Generous free tier (3,000 emails/month)
 * - Built-in React email templates
 * - Good deliverability rates
 * - Straightforward environment variable setup
 *
 * Docs: https://resend.com/docs/send-emails
 * Convex Integration: https://resend.com/convex
 * Example: https://github.com/get-convex/convex-auth-example/blob/main/convex/otp/ResendOTP.ts
 */

import Email from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

/**
 * Magic link email template (plain text fallback)
 */
function magicLinkText(token: string, expires: Date): string {
  return `
Sign in to Capo Business Simulation

Click the link below to sign in:

${token}

This link will expire at ${expires.toLocaleString()}.

If you didn't request this email, you can safely ignore it.
`.trim();
}

/**
 * Magic link email template (HTML)
 */
function magicLinkHTML(token: string, expires: Date): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to Capo</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
      <h1 style="color: #1a1a1a; margin-top: 0; margin-bottom: 20px;">Capo Business Simulation</h1>
      <p style="margin-bottom: 20px;">Click the button below to sign in to your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${token}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Sign In</a>
      </div>
      <p style="margin-bottom: 10px;">Or copy and paste this link into your browser:</p>
      <p style="background-color: #e9ecef; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px;">${token}</p>
      <p style="margin-top: 30px; margin-bottom: 10px;">This link will expire at <strong>${expires.toLocaleString()}</strong>.</p>
      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">If you didn't request this email, you can safely ignore it.</p>
    </div>
  </body>
</html>
`.trim();
}

/**
 * Resend email provider configuration
 *
 * Environment Variables Required:
 * - AUTH_RESEND_KEY: Resend API key (get one at https://resend.com/api-keys)
 * - AUTH_EMAIL: From email address (default: "noreply@capo.sim")
 *
 * Setup:
 * 1. Create a Resend account at https://resend.com
 * 2. Generate an API key
 * 3. Set environment variable in Convex dashboard:
 *    - Go to Settings → Environment Variables
 *    - Add AUTH_RESEND_KEY = re_xxxxxxxxx
 *    - Add AUTH_EMAIL = Capo <noreply@yourdomain.com>
 *
 * Token Expiration:
 * - maxAge: 900 seconds (15 minutes)
 * - Tokens are automatically tracked in Convex to prevent replay attacks
 * - Each token can only be used once
 */
export const Resend = Email({
  id: "resend-magic-link",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 900, // 15 minutes in seconds

  async sendVerificationRequest({
    identifier: email,
    provider,
    token,
    expires,
  }) {
    const resend = new ResendAPI(provider.apiKey);

    // Calculate expiration date for display
    expires = new Date(expires);

    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL ?? "Capo <noreply@capo.sim>",
      to: [email],
      subject: "Sign in to Capo Business Simulation",
      html: magicLinkHTML(token, expires),
      text: magicLinkText(token, expires),
    });

    if (error) {
      console.error("Resend email error:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to send magic link email: ${JSON.stringify(error)}`);
    }

    console.log(`Magic link sent to ${email}, expires at ${expires.toISOString()}`);
  },
});
