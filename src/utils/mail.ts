import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = parseInt(process.env.SMTP_PORT || '587', 10)
const secure = process.env.SMTP_PORT === '465'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASSWORD
const from = process.env.SMTP_FROM || `"IT Avenue" <${user}>`

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  const mailOptions = {
    from,
    to,
    subject,
    html,
    text,
  }

  if (!user || !pass) {
    console.log('\n--- EMAIL SIMULATION (SMTP Not Configured) ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body (Text):\n${text}`)
    console.log('----------------------------------------------\n')
    return { success: true, simulated: true }
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`Email successfully sent to ${to}: ${info.messageId}`)
    return { success: true, info }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    throw error
  }
}

export async function sendSignupOtpEmail(email: string, otp: string, link?: string) {
  const subject = 'Verify your email for IT Avenue'
  const text = `Thank you for registering with IT Avenue Task Management System. Please use the following verification code to complete your signup: ${otp}. This code is valid for 10 minutes.${link ? `\n\nOr click the following link to verify your email directly:\n\n${link}` : ''}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email</title>
  <style>
    body {
      background-color: #fff8f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(200, 24, 90, 0.05);
      border: 1px solid #ebebeb;
    }
    .header {
      font-size: 20px;
      font-weight: 700;
      color: #1a1218;
      text-align: center;
      margin-bottom: 12px;
    }
    .content {
      font-size: 15px;
      line-height: 24px;
      color: #4a4455;
      text-align: center;
      margin-bottom: 32px;
    }
    .otp-code {
      display: inline-block;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #C8185A;
      background-color: rgba(200, 24, 90, 0.05);
      padding: 16px 28px;
      border-radius: 12px;
      margin: 16px auto;
      font-family: monospace;
      border: 1px dashed rgba(200, 24, 90, 0.2);
    }
    .btn-container {
      text-align: center;
      margin: 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C8185A;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(200, 24, 90, 0.2);
    }
    .footer {
      font-size: 12px;
      color: #a0a0a0;
      text-align: center;
      border-top: 1px solid #ebebeb;
      padding-top: 20px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; font-size: 24px; font-weight: 800; color: #C8185A; letter-spacing: 1px; margin-bottom: 24px;">
      IT <span style="color: #1a1218;">Avenue</span>
    </div>
    <div class="header">Verify your email address</div>
    <div class="content">
      Thank you for registering with <strong>IT Avenue Task Management System</strong>. Please use the following verification code to complete your signup process. This code will expire in 10 minutes.
    </div>
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    ${link ? `
    <div class="btn-container">
      <a href="${link}" class="btn" target="_blank">Verify Email</a>
    </div>
    <div class="content" style="margin-top: 24px;">
      Or copy and paste this link in your browser:<br>
      <a href="${link}" style="color: #C8185A; word-break: break-all;">${link}</a>
    </div>
    ` : ''}
    <div class="content" style="margin-top: 24px;">
      If you did not initiate this request, please ignore this email.
    </div>
    <div class="footer">
      &copy; 2026 Rotaract Club of University of Moratuwa. All rights reserved.<br>
      IT Division, IT Avenue.
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: email, subject, html, text })
}

export async function sendInvitationEmail(
  email: string,
  name: string,
  role: string,
  link: string
) {
  const subject = "You've been invited to join IT Avenue"
  const text = `Hello ${name},\n\nYou have been invited to join the IT Avenue Task Management System as a ${role}. Click the following link to accept the invitation and set up your account password:\n\n${link}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You've been invited to IT Avenue</title>
  <style>
    body {
      background-color: #fff8f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(200, 24, 90, 0.05);
      border: 1px solid #ebebeb;
    }
    .header {
      font-size: 20px;
      font-weight: 700;
      color: #1a1218;
      text-align: center;
      margin-bottom: 12px;
    }
    .content {
      font-size: 15px;
      line-height: 24px;
      color: #4a4455;
      text-align: center;
      margin-bottom: 32px;
    }
    .btn-container {
      text-align: center;
      margin: 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C8185A;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(200, 24, 90, 0.2);
    }
    .footer {
      font-size: 12px;
      color: #a0a0a0;
      text-align: center;
      border-top: 1px solid #ebebeb;
      padding-top: 20px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; font-size: 24px; font-weight: 800; color: #C8185A; letter-spacing: 1px; margin-bottom: 24px;">
      IT <span style="color: #1a1218;">Avenue</span>
    </div>
    <div class="header">Join the IT Avenue Workspace</div>
    <div class="content">
      Hello <strong>${name}</strong>,<br><br>
      You have been invited to join the <strong>IT Avenue Task Management System</strong> as a <strong>${role}</strong>. Click the button below to accept the invitation and set up your account password.
    </div>
    <div class="btn-container">
      <a href="${link}" class="btn" target="_blank">Accept Invitation</a>
    </div>
    <div class="content" style="margin-top: 24px;">
      Or copy and paste this link in your browser:<br>
      <a href="${link}" style="color: #C8185A; word-break: break-all;">${link}</a>
    </div>
    <div class="footer">
      &copy; 2026 Rotaract Club of University of Moratuwa. All rights reserved.<br>
      IT Division, IT Avenue.
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: email, subject, html, text })
}
