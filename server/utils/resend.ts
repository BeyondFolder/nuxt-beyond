import { Resend } from 'resend';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

export const NO_REPLY_EMAIL = process.env.NO_REPLY_EMAIL || 'noreply@updates.yourdomain.com';

let _resendInstance: Resend | null = null;

export function getResend() {
  if (!_resendInstance) {
    _resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return _resendInstance;
}

export function getAudienceId() {
  return process.env.RESEND_AUDIENCE_ID as string;
}

export async function sendPasswordResetEmail(email: string, resetToken: string, origin: string) {
  const resetUrl = `${origin}/reset-password?token=${resetToken}`;

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="background: ${THEME_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  origin: string,
  isNewLink = false
) {
  const verificationUrl = `${origin}/verify-email/${verificationToken}`;

  const subject = isNewLink ? 'New Email Verification Link' : 'Verify Your Email Address';
  const heading = isNewLink ? 'Email Verification Link Expired' : 'Welcome to NuxtBeyond!';
  const message = isNewLink
    ? "Your previous verification link has expired. We've sent you a new one:"
    : 'Thank you for signing up. Please verify your email address to complete your registration:';

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>${message}</p>
        <p>
          <a href="${verificationUrl}" style="background: ${THEME_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't ${isNewLink ? 'request this' : 'create an account'}, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendNewSupportQuestionEmail(params: {
  memberEmails: string[];
  projectName: string;
  customerName: string | null;
  customerEmail: string;
  question: string;
  questionId: string;
  projectId: string;
  siteUrl: string;
  supportsEscalation: boolean;
  primaryColor?: string;
}) {
  const {
    memberEmails,
    projectName,
    customerName,
    customerEmail,
    question,
    questionId,
    projectId,
    siteUrl,
    supportsEscalation,
    primaryColor = THEME_PRIMARY_COLOR,
  } = params;

  const subject = supportsEscalation
    ? `New support question for ${projectName}`
    : `Upgrade to respond: New question for ${projectName}`;

  const heading = supportsEscalation ? 'New Support Question' : 'New Question Received';

  const description = supportsEscalation
    ? `A customer has requested human support for <strong>${escapeHtml(projectName)}</strong>.`
    : `A customer has submitted a question for <strong>${escapeHtml(projectName)}</strong>. <br /> <strong>Upgrade to Starter or higher to respond to customer questions directly.</strong>`;

  const buttonText = supportsEscalation ? 'View and Respond' : 'Upgrade to Respond';

  const targetUrl = supportsEscalation ? `/dashboard/questions?questionId=${questionId}` : `/dashboard/billing`;

  const buttonUrl = `${siteUrl}/projects/${projectId}/redirect?target=${encodeURIComponent(targetUrl)}`;

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: memberEmails,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>${description}</p>

        ${
          supportsEscalation
            ? `
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${escapeHtml(customerName || customerEmail)}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
            <p style="margin: 4px 0;"><strong>Question:</strong></p>
            <p style="margin: 4px 0; padding-left: 12px; border-left: 3px solid ${primaryColor};">${escapeHtml(question)}</p>
          </div>
        `
            : ''
        }

        ${
          !supportsEscalation
            ? `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Free Plan Limitation:</strong> You cannot respond to customer questions on the Free plan.
              Upgrade to unlock support escalation features and help your customers directly.
            </p>
          </div>
        `
            : ''
        }

        <p>
          <a href="${buttonUrl}" style="background: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            ${buttonText}
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendSupportAnswerEmail(params: {
  customerEmail: string;
  customerName: string | null;
  projectName: string;
  question: string;
  answer: string;
  memberEmails: string[];
  primaryColor?: string;
}) {
  const {
    customerEmail,
    customerName,
    projectName,
    question,
    answer,
    memberEmails,
    primaryColor = THEME_PRIMARY_COLOR,
  } = params;

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: customerEmail,
    bcc: memberEmails,
    subject: `Response to your ${projectName} support question`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Question Has Been Answered</h2>
        <p>Hello ${escapeHtml(customerName || 'there')},</p>
        <p>We've received your question about <strong>${escapeHtml(projectName)}</strong> and here's our response:</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Your question:</strong></p>
          <p style="margin: 4px 0; padding-left: 12px; border-left: 3px solid ${primaryColor};">${escapeHtml(question)}</p>
        </div>

        <div style="background: #f0fffe; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Our answer:</strong></p>
          <p style="margin: 4px 0; padding-left: 12px; border-left: 3px solid ${primaryColor}; white-space: pre-wrap;">${escapeHtml(answer)}</p>
        </div>

        <p>If you have any follow-up questions, please feel free to reach out again.</p>
      </div>
    `,
  });
}

export async function sendFeedbackEmail(params: { userEmail: string; userName: string; message: string }) {
  const { userEmail, userName, message } = params;

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: process.env.SUPPORT_EMAIL || 'support@yourdomain.com',
    replyTo: userEmail,
    subject: `Feedback from ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Feedback</h2>
        <p><strong>From:</strong> ${escapeHtml(userName)} (${escapeHtml(userEmail)})</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>
    `,
  });
}

export async function sendInvitationEmail(params: {
  email: string;
  inviterName: string;
  projectName: string;
  role: string;
  invitationId: string;
  siteUrl: string;
  primaryColor?: string;
}) {
  const { email, inviterName, projectName, role, invitationId, siteUrl, primaryColor = THEME_PRIMARY_COLOR } = params;

  const acceptUrl = `${siteUrl}/invitations/accept?token=${invitationId}`;
  const declineUrl = `${siteUrl}/invitations/decline?token=${invitationId}`;

  await getResend().emails.send({
    from: NO_REPLY_EMAIL,
    to: email,
    subject: `You've been invited to join ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Project Invitation</h2>
        <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join the <strong>${escapeHtml(projectName)}</strong> project as a <strong>${escapeHtml(role)}</strong>.</p>
        <p>Click the button below to accept the invitation:</p>
        <p>
          <a href="${acceptUrl}" style="background: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>
          <a href="${declineUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px;">
            Decline Invitation
          </a>
        </p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you don't have an account yet, you'll be prompted to create one.</p>
      </div>
    `,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
