import nodemailer from "nodemailer";
import { APP_NAME, COMPANY_NAME, COMPANY_URL } from "@/lib/constants";
import type { UserRole } from "@/types/database";
import { homePathForRole } from "@/lib/rbac";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function fromEmail() {
  return (
    process.env.EMAIL?.trim() ||
    process.env.MAIL_FROM_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

/** Gmail App Password (spaces allowed — stripped automatically). */
function fromPassword() {
  return (
    process.env.EMAIL_PASSWORD ||
    process.env.MAIL_PASSWORD ||
    process.env.SMTP_PASS ||
    ""
  )
    .replace(/\s+/g, "")
    .trim();
}

function mailConfigured() {
  return Boolean(fromEmail() && fromPassword());
}

function createTransport() {
  const user = fromEmail();
  const pass = fromPassword();
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function fromHeader() {
  const name = process.env.MAIL_FROM_NAME || `${APP_NAME} by ${COMPANY_NAME}`;
  return `"${name}" <${fromEmail()}>`;
}

function roleLabel(role: UserRole) {
  if (role === "client") return "Client Portal";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function wrapHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#e8eef5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #c5d3e4;">
          <tr>
            <td style="background:#24548c;padding:24px 28px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d4deea;">${COMPANY_NAME}</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              This message was sent by ${APP_NAME}, a product of
              <a href="${COMPANY_URL}" style="color:#24548c;text-decoration:none;">${COMPANY_NAME}</a>.
              If you did not expect this email, please ignore it or contact your administrator.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!mailConfigured()) {
    console.warn("[mail] SMTP not configured — skipped:", params.subject);
    return { sent: false as const, reason: "not_configured" as const };
  }

  try {
    const transport = createTransport();
    await transport.sendMail({
      from: fromHeader(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[mail] send failed:", error);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

/** Professional English email when an account / portal is approved. */
export async function sendAccountApprovedEmail(params: {
  to: string;
  fullName: string;
  role: UserRole;
}) {
  const label = roleLabel(params.role);
  const isClient = params.role === "client";
  const path = homePathForRole(params.role);
  const accessUrl = `${appBaseUrl()}${path}`;
  const loginUrl = `${appBaseUrl()}/login`;

  const subject = isClient
    ? `${APP_NAME}: Your client portal access has been approved`
    : `${APP_NAME}: Your ${label} account has been approved`;

  const greeting = `Dear ${params.fullName},`;

  const bodyText = isClient
    ? [
        greeting,
        "",
        `We are pleased to inform you that your ${APP_NAME} Client Portal access has been approved by our team.`,
        "",
        "You may now sign in and review your project progress, tasks, meetings, and shared documents.",
        "",
        `Sign in: ${loginUrl}`,
        `Portal: ${accessUrl}`,
        "",
        "If you need assistance, please contact your account manager.",
        "",
        "Kind regards,",
        `The ${COMPANY_NAME} Team`,
      ].join("\n")
    : [
        greeting,
        "",
        `We are pleased to inform you that your ${APP_NAME} ${label} account has been approved.`,
        "",
        "You can now access the workspace dashboard and begin using the features available for your role.",
        "",
        `Sign in: ${loginUrl}`,
        `Dashboard: ${accessUrl}`,
        "",
        "If you did not request this account, please contact your administrator immediately.",
        "",
        "Kind regards,",
        `The ${COMPANY_NAME} Team`,
      ].join("\n");

  const ctaLabel = isClient ? "Open Client Portal" : "Open Dashboard";
  const intro = isClient
    ? `We are pleased to inform you that your <strong>${APP_NAME} Client Portal</strong> access has been approved by our team.`
    : `We are pleased to inform you that your <strong>${APP_NAME} ${label}</strong> account has been approved.`;

  const detail = isClient
    ? "You may now sign in to review project progress, tasks, meetings with your manager, and shared documents."
    : "You can now access the workspace dashboard and begin using the features available for your role.";

  const html = wrapHtml(
    subject,
    `
      <p style="margin:0 0 16px;font-size:16px;">${greeting}</p>
      <p style="margin:0 0 16px;line-height:1.55;color:#334155;">${intro}</p>
      <p style="margin:0 0 24px;line-height:1.55;color:#334155;">${detail}</p>
      <p style="margin:0 0 28px;">
        <a href="${loginUrl}" style="display:inline-block;background:#24548c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">
          ${ctaLabel}
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
        Or open this link:<br />
        <a href="${accessUrl}" style="color:#24548c;">${accessUrl}</a>
      </p>
      <p style="margin:24px 0 0;line-height:1.55;color:#334155;">
        Kind regards,<br />
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `
  );

  return sendMail({
    to: params.to,
    subject,
    html,
    text: bodyText,
  });
}

/** Optional professional rejection notice. */
export async function sendAccountRejectedEmail(params: {
  to: string;
  fullName: string;
  role: UserRole;
}) {
  const label = roleLabel(params.role);
  const subject = `${APP_NAME}: Update on your ${label} registration`;

  const text = [
    `Dear ${params.fullName},`,
    "",
    `Thank you for your interest in ${APP_NAME}. After review, your ${label} registration was not approved at this time.`,
    "",
    "If you believe this is an error, please contact your administrator or Wrapify Solutions for further assistance.",
    "",
    "Kind regards,",
    `The ${COMPANY_NAME} Team`,
  ].join("\n");

  const html = wrapHtml(
    subject,
    `
      <p style="margin:0 0 16px;font-size:16px;">Dear ${params.fullName},</p>
      <p style="margin:0 0 16px;line-height:1.55;color:#334155;">
        Thank you for your interest in <strong>${APP_NAME}</strong>. After review, your
        <strong>${label}</strong> registration was not approved at this time.
      </p>
      <p style="margin:0 0 16px;line-height:1.55;color:#334155;">
        If you believe this is an error, please contact your administrator for further assistance.
      </p>
      <p style="margin:24px 0 0;line-height:1.55;color:#334155;">
        Kind regards,<br />
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `
  );

  return sendMail({ to: params.to, subject, html, text });
}

/** 6-digit email verification OTP for new registrations. */
export async function sendRegistrationOtpEmail(params: {
  to: string;
  fullName: string;
  otp: string;
}) {
  const subject = `${APP_NAME}: Your verification code`;
  const text = [
    `Dear ${params.fullName},`,
    "",
    `Your ${APP_NAME} email verification code is: ${params.otp}`,
    "",
    "This code expires in 10 minutes. Do not share it with anyone.",
    "",
    "If you did not request this code, you can safely ignore this email.",
    "",
    "Kind regards,",
    `The ${COMPANY_NAME} Team`,
  ].join("\n");

  const html = wrapHtml(
    subject,
    `
      <p style="margin:0 0 16px;font-size:16px;">Dear ${params.fullName},</p>
      <p style="margin:0 0 16px;line-height:1.55;color:#334155;">
        Use the verification code below to confirm your email and continue creating your
        <strong>${APP_NAME}</strong> account. Your account is saved only after successful verification.
      </p>
      <p style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;letter-spacing:0.35em;font-size:28px;font-weight:800;color:#24548c;background:#eef3f9;padding:14px 22px;border-radius:12px;">
          ${params.otp}
        </span>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
        This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
      </p>
      <p style="margin:24px 0 0;line-height:1.55;color:#334155;">
        Kind regards,<br />
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `
  );

  return sendMail({ to: params.to, subject, html, text });
}

/** OTP for forgot-password flow. */
export async function sendPasswordResetOtpEmail(params: {
  to: string;
  fullName: string;
  otp: string;
}) {
  const subject = `${APP_NAME}: Password reset verification code`;
  const text = [
    `Dear ${params.fullName},`,
    "",
    `Your ${APP_NAME} password reset code is: ${params.otp}`,
    "",
    "This code expires in 10 minutes. If you did not request a password reset, ignore this email.",
    "",
    "Kind regards,",
    `The ${COMPANY_NAME} Team`,
  ].join("\n");

  const html = wrapHtml(
    subject,
    `
      <p style="margin:0 0 16px;font-size:16px;">Dear ${params.fullName},</p>
      <p style="margin:0 0 16px;line-height:1.55;color:#334155;">
        Use this code to verify your identity and set a new password for your
        <strong>${APP_NAME}</strong> account.
      </p>
      <p style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;letter-spacing:0.35em;font-size:28px;font-weight:800;color:#24548c;background:#eef3f9;padding:14px 22px;border-radius:12px;">
          ${params.otp}
        </span>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
        Expires in <strong>10 minutes</strong>. Do not share this code.
      </p>
      <p style="margin:24px 0 0;line-height:1.55;color:#334155;">
        Kind regards,<br />
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `
  );

  return sendMail({ to: params.to, subject, html, text });
}
