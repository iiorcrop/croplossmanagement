const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

// ── Helpers to get real-time config ────────────────────────────────────────

async function getEmailConfig() {
  const dbSettings = await Settings.findOne({ key: 'email_config' });
  if (dbSettings && dbSettings.value) {
    return {
      host: dbSettings.value.host,
      port: parseInt(dbSettings.value.port),
      user: dbSettings.value.user,
      pass: dbSettings.value.pass,
      from: dbSettings.value.from
    };
  }
  return {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
  };
}

async function getWhatsAppConfig() {
  const dbSettings = await Settings.findOne({ key: 'whatsapp_config' });
  if (dbSettings && dbSettings.value) {
    return {
      sid: dbSettings.value.sid,
      token: dbSettings.value.token,
      from: dbSettings.value.from
    };
  }
  return {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_FROM
  };
}

// ── Core send functions ───────────────────────────────────────────────────

async function sendWhatsApp(to, message) {
  if (!to) return;
  const config = await getWhatsAppConfig();
  const toFormatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`;

  if (!config.sid || config.sid.includes('xxxx')) {
    console.log(`📱 [WA MOCK] To: ${toFormatted}\n${message}\n`);
    return;
  }

  try {
    const client = require('twilio')(config.sid, config.token);
    await client.messages.create({
      from: config.from,
      to: toFormatted,
      body: message,
    });
    console.log(`📱 WhatsApp sent to ${to}`);
  } catch (err) {
    console.error(`❌ WhatsApp error for ${to}:`, err.message);
  }
}

async function sendEmail(to, subject, html, text = '') {
  if (!to) return;
  const config = await getEmailConfig();

  if (!config.user || config.user.includes('your_email')) {
    console.log(`📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: config.from,
      to, subject, html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email error for ${to}:`, err.message);
  }
}

// ── Notification templates ────────────────────────────────────────────────

async function notifyNewSubmission({ entry, submitter, cropHeads }) {
  const crop = entry.crop.toUpperCase();
  for (const head of cropHeads) {
    const wa = `🌾 *CropLoss Portal – New Submission*\n\n*Crop:* ${crop}\n*Center:* ${entry.centerName}\n*District:* ${entry.district}\n*Season:* ${entry.season}\n*Locations:* ${entry.totalLocations}\n*Avg Wilt:* ${entry.avgWilt}%\n*Submitted by:* ${submitter.name}\n\nPlease login to review:\nhttp://localhost:3000/review`;
    const html = `<h2>New ${crop} Survey Submitted</h2><table><tr><td><b>Center:</b></td><td>${entry.centerName}</td></tr><tr><td><b>District:</b></td><td>${entry.district}</td></tr><tr><td><b>Season:</b></td><td>${entry.season}</td></tr><tr><td><b>Locations:</b></td><td>${entry.totalLocations}</td></tr><tr><td><b>Avg Wilt:</b></td><td>${entry.avgWilt}%</td></tr><tr><td><b>Submitted by:</b></td><td>${submitter.name}</td></tr></table><br><a href="http://localhost:3000/review">Click here to review</a>`;
    if (head.notifyWhatsApp && head.phone) await sendWhatsApp(head.phone, wa);
    if (head.notifyEmail && head.email) await sendEmail(head.email, `[CropLoss] New ${crop} Survey – ${entry.centerName}`, html);
  }
}

async function notifyApproved({ entry, submitter, approver }) {
  const crop = entry.crop.toUpperCase();
  const wa = `✅ *CropLoss Portal – Survey Approved*\n\nYour *${crop}* crop loss survey has been approved!\n\n*District:* ${entry.district}\n*Season:* ${entry.season}\n*Approved by:* ${approver.name}\n${entry.reviewComments ? `\n*Comments:* ${entry.reviewComments}` : ''}\n\nThank you for your submission.`;
  const html = `<h2 style="color:green">✅ Survey Approved</h2><p>Your <b>${crop}</b> crop loss survey for <b>${entry.season}</b> has been <b style="color:green">approved</b> by <b>${approver.name}</b>.</p>${entry.reviewComments ? `<p><b>Comments:</b> ${entry.reviewComments}</p>` : ''}<p>District: ${entry.district} | Center: ${entry.centerName}</p>`;
  if (submitter.notifyWhatsApp && submitter.phone) await sendWhatsApp(submitter.phone, wa);
  if (submitter.notifyEmail && submitter.email) await sendEmail(submitter.email, `[CropLoss] ✅ ${crop} Survey Approved`, html);
}

async function notifyCorrectionRequested({ entry, submitter, reviewer, note }) {
  const crop = entry.crop.toUpperCase();
  const wa = `🔄 *CropLoss Portal – Correction Required*\n\nYour *${crop}* survey needs correction before it can be approved.\n\n*District:* ${entry.district}\n*Season:* ${entry.season}\n*Reviewed by:* ${reviewer.name}\n\n*Correction Note:*\n"${note}"\n\nPlease login, edit your submission, and resubmit:\nhttp://localhost:3000`;
  const html = `<h2 style="color:orange">🔄 Correction Required</h2><p>Your <b>${crop}</b> survey needs correction.</p><blockquote style="background:#fff3cd;border-left:4px solid orange;padding:10px">${note}</blockquote><p><b>Reviewed by:</b> ${reviewer.name}</p><p><a href="http://localhost:3000">Login to edit and resubmit</a></p>`;
  if (submitter.notifyWhatsApp && submitter.phone) await sendWhatsApp(submitter.phone, wa);
  if (submitter.notifyEmail && submitter.email) await sendEmail(submitter.email, `[CropLoss] 🔄 ${crop} Survey – Correction Required`, html);
}

async function notifyRejected({ entry, submitter, reviewer, reason }) {
  const crop = entry.crop.toUpperCase();
  const wa = `❌ *CropLoss Portal – Survey Rejected*\n\nYour *${crop}* survey has been rejected.\n\n*District:* ${entry.district}\n*Season:* ${entry.season}\n*Rejected by:* ${reviewer.name}\n\n*Reason:*\n"${reason}"\n\nPlease contact your administrator for assistance.`;
  const html = `<h2 style="color:red">❌ Survey Rejected</h2><p>Your <b>${crop}</b> survey was rejected by <b>${reviewer.name}</b>.</p><blockquote style="background:#fee;border-left:4px solid red;padding:10px"><b>Reason:</b> ${reason}</blockquote>`;
  if (submitter.notifyWhatsApp && submitter.phone) await sendWhatsApp(submitter.phone, wa);
  if (submitter.notifyEmail && submitter.email) await sendEmail(submitter.email, `[CropLoss] ❌ ${crop} Survey Rejected`, html);
}

async function notifyHighLoss({ entry, admins, cropHeads }) {
  const crop = entry.crop.toUpperCase();
  const wa = `🚨 *HIGH LOSS ALERT – CropLoss Portal*\n\n*${crop}* survey shows critically high wilt!\n\n*Center:* ${entry.centerName}\n*District:* ${entry.district}\n*Season:* ${entry.season}\n🔴 *Max Wilt:* ${entry.maxWilt}%\n📊 *Avg Wilt:* ${entry.avgWilt}%\n\nImmediate attention required!\nLogin: http://localhost:3000`;
  const html = `<h2 style="color:red">🚨 HIGH LOSS ALERT</h2><table><tr><td><b>Crop:</b></td><td>${crop}</td></tr><tr><td><b>Center:</b></td><td>${entry.centerName}</td></tr><tr><td><b>Max Wilt:</b></td><td style="color:red;font-size:18px"><b>${entry.maxWilt}%</b></td></tr><tr><td><b>Avg Wilt:</b></td><td>${entry.avgWilt}%</td></tr></table>`;
  const all = [...(admins || []), ...(cropHeads || [])];
  for (const u of all) {
    if (u.notifyWhatsApp && u.phone) await sendWhatsApp(u.phone, wa);
    if (u.notifyEmail && u.email) await sendEmail(u.email, `[HIGH ALERT] ${crop} Wilt ${entry.maxWilt}% at ${entry.centerName}`, html);
  }
}

async function notifyResubmitted({ entry, submitter, cropHeads }) {
  const crop = entry.crop.toUpperCase();
  for (const head of cropHeads) {
    const wa = `🔄 *CropLoss Portal – Survey Resubmitted*\n\n*${crop}* survey has been corrected and resubmitted.\n\n*Center:* ${entry.centerName}\n*District:* ${entry.district}\n*Submitted by:* ${submitter.name}\n\nPlease review again:\nhttp://localhost:3000/review`;
    if (head.notifyWhatsApp && head.phone) await sendWhatsApp(head.phone, wa);
    if (head.notifyEmail && head.email) await sendEmail(head.email, `[CropLoss] ${crop} Survey Resubmitted – ${entry.centerName}`, `<p>Resubmitted for review. <a href="http://localhost:3000/review">Review now</a></p>`);
  }
}

module.exports = {
  sendWhatsApp, sendEmail,
  notifyNewSubmission, notifyApproved, notifyCorrectionRequested,
  notifyRejected, notifyHighLoss, notifyResubmitted,
};
