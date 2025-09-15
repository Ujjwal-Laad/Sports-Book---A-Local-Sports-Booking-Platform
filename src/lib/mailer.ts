import nodemailer from "nodemailer";

export async function sendMail(to: string, subject: string, html: string) {
  // Environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || '"Sportsbook" <noreply@sportsbook.com>';

  if (!emailUser || !emailPass) {
    console.error("Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.");
    throw new Error("Email configuration incomplete");
  }

  // Create transporter with correct Gmail settings
  const transporter = nodemailer.createTransport({
    service: "gmail", // This automatically sets correct host/port/secure settings
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Send mail
  const info = await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html,
  });

  console.log("Message sent:", info.messageId);
  return info;
}