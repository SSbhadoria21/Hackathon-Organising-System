import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}


export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Brevitas" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject,
    html,
  });
}
export async function sendVerificationOtp(
  to: string,
  fullName: string,
  otp: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Verify your Brevitas account</h2>
      <p>Hi ${fullName},</p>
      <p>Your verification code is:</p>
      <div style="
        background: #f4f4f5;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        font-size: 36px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #1a1a1a;
        margin: 20px 0;
      ">${otp}</div>
      <p style="color: #666; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #666; font-size: 14px;">If you didn't create a Brevitas account, ignore this email.</p>
    </div>
  `;
  await sendEmail(to, 'Your Brevitas verification code', html);
}

export async function sendJudgeMagicLink(
  to: string,
  judgeName: string,
  hackathonName: string,
  magicLink: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">You've been invited to judge ${hackathonName}</h2>
      <p>Hi ${judgeName},</p>
      <p>You have been added as a judge for <strong>${hackathonName}</strong> on Brevitas.</p>
      <p>Click the button below to access your judge dashboard:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}" style="
          background: #1a1a1a;
          color: white;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        ">Open Judge Dashboard</a>
      </div>
      <p style="color: #666; font-size: 13px;">This link is valid for 30 days and is unique to you. Do not share it.</p>
      <p style="color: #666; font-size: 13px;">Link: <a href="${magicLink}">${magicLink}</a></p>
    </div>
  `;
  await sendEmail(to, `Judge invitation: ${hackathonName}`, html);
}


export async function sendDeadlineReminder(
  to: string,
  teamName: string,
  hackathonName: string,
  roundName: string,
  deadlineStr: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #e53e3e;">Submission deadline reminder</h2>
      <p>Hi Team <strong>${teamName}</strong>,</p>
      <p>The <strong>${roundName}</strong> submission deadline for <strong>${hackathonName}</strong> is coming up:</p>
      <p style="font-size: 20px; font-weight: bold; color: #1a1a1a;">${deadlineStr}</p>
      <p>Make sure your submission is in before it closes!</p>
    </div>
  `;
  await sendEmail(to, `⏰ Deadline reminder: ${roundName} — ${hackathonName}`, html);
}


export async function sendResultsNotification(
  to: string,
  teamName: string,
  hackathonName: string,
  advanced: boolean,
  rank?: number
): Promise<void> {
  const subject = advanced
    ? `🎉 Congratulations! You advanced — ${hackathonName}`
    : `${hackathonName} — Round results published`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>${advanced ? '🎉 You advanced!' : 'Round results are in'}</h2>
      <p>Hi Team <strong>${teamName}</strong>,</p>
      ${
        advanced
          ? `<p>Your team has advanced to the next round of <strong>${hackathonName}</strong>!${rank ? ` You ranked <strong>#${rank}</strong>.` : ''}</p>`
          : `<p>The results for <strong>${hackathonName}</strong> are now published. Log in to Brevitas to see your scores and feedback.</p>`
      }
    </div>
  `;
  await sendEmail(to, subject, html);
}
