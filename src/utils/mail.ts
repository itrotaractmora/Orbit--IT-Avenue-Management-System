import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = parseInt(process.env.SMTP_PORT || '587', 10)
const secure = process.env.SMTP_PORT === '465'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASSWORD
const from = process.env.SMTP_FROM || `"Orbit" <${user}>`

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

export async function sendSignupOtpEmail(email: string, otp: string) {
  const subject = 'Your Orbit verification code'
  const text = `Your verification code is: ${otp}\n\nUse this code to verify your email address on Orbit | RotaractMora IT Avenue Management System. This code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nOrbit - Rotaract Club of University of Moratuwa`
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #333;">
  <h2 style="text-align: center; margin-bottom: 8px;">
    <span style="color: #C8185A; font-weight: 800;">IT</span> <span style="color: #1a1218; font-weight: 800;">Avenue</span>
  </h2>
  <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 24px;">
    Your verification code is:
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #C8185A; background-color: #fef2f5; padding: 16px 28px; border-radius: 12px; font-family: monospace;">${otp}</span>
  </div>
  <p style="text-align: center; font-size: 14px; color: #888; margin-top: 24px;">
    This code expires in 10 minutes.
  </p>
  <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 16px;">
    If you did not request this, please ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="text-align: center; font-size: 11px; color: #bbb;">
    Rotaract Club of University of Moratuwa &mdash; IT Division
  </p>
</div>
  `

  return sendEmail({ to: email, subject, html, text })
}

export async function sendInvitationEmail(
  email: string,
  name: string,
  role: string,
  code: string
) {
  const subject = 'Your Orbit invitation code'
  const text = `Hello ${name},\n\nYou have been invited to join Orbit | RotaractMora IT Avenue Management System as a ${role}.\n\nYour invitation code is: ${code}\n\nTo accept, go to the Orbit website and enter this code on the Join page.\n\nThis code expires in 48 hours.\n\nIf you did not expect this, please ignore this email.\n\nRotaract Club of University of Moratuwa — IT Division`
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #333;">
  <h2 style="text-align: center; margin-bottom: 8px;">
    <span style="color: #C8185A; font-weight: 800;">IT</span> <span style="color: #1a1218; font-weight: 800;">Avenue</span>
  </h2>
  <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 8px;">
    Hello ${name}, you have been invited to join as a <strong>${role}</strong>.
  </p>
  <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 24px;">
    Your invitation code is:
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #C8185A; background-color: #fef2f5; padding: 16px 28px; border-radius: 12px; font-family: monospace;">${code}</span>
  </div>
  <p style="text-align: center; font-size: 14px; color: #888; margin-top: 24px;">
    Enter this code on the Join page to set up your account. This code expires in 48 hours.
  </p>
  <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 16px;">
    If you did not expect this, please ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="text-align: center; font-size: 11px; color: #bbb;">
    Rotaract Club of University of Moratuwa &mdash; IT Division
  </p>
</div>
  `

  return sendEmail({ to: email, subject, html, text })
}

