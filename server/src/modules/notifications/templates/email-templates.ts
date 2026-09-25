import {
  ProspectConfirmationData,
  ProspectReminderData,
  CompanyAppointmentData,
} from "../interfaces/notification.interface";

/**
 * Base styling wrapper for luxury Spacia HTML emails
 */
function wrapLuxuryEmail(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f5; color: #1c1917; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #0d4a36; padding: 32px 28px; text-align: left; }
    .header-logo { color: #fbfbf9; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; text-transform: uppercase; }
    .header-tag { display: inline-block; background: rgba(255,255,255,0.15); color: #d1fae5; font-size: 11px; padding: 3px 8px; border-radius: 4px; margin-top: 6px; font-weight: 500; }
    .content { padding: 32px 28px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #78716c; margin-bottom: 12px; }
    .card { background: #fbfbf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
    .badge-hot { background: #ffe4e6; color: #be123c; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .badge-warm { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .btn { display: inline-block; background: #0d4a36; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 13px; text-align: center; }
    .btn-secondary { background: #ffffff; color: #0d4a36 !important; border: 1px solid #0d4a36; margin-left: 8px; }
    .footer { background: #fafaf9; border-top: 1px solid #e7e5e4; padding: 24px 28px; text-align: center; font-size: 11px; color: #a8a29e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">Spacia</div>
      <div class="header-tag">Private Wealth & Luxury Real Estate</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Spacia • Private Wealth &amp; Luxury Real Estate</p>
      <p style="margin: 0;">This communication is confidential and intended solely for the recipient.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. PROSPECT: Booking Confirmation & Viewing Details
 */
export function renderProspectBookingConfirmation(data: ProspectConfirmationData): { subject: string; html: string; text: string } {
  const formattedDate = new Date(data.scheduledStartAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = `${new Date(data.scheduledStartAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(data.scheduledEndAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  const subject = `Confirmed: Private Viewing of ${data.propertyTitle} (${data.referenceCode})`;

  const bodyContent = `
    <h1 style="font-size: 22px; font-weight: 700; color: #0d4a36; margin: 0 0 8px 0;">Viewing Confirmed</h1>
    <p style="font-size: 14px; color: #57534e; margin: 0 0 24px 0;">Dear ${data.leadName}, your private appointment to inspect <strong>${data.propertyTitle}</strong> has been secured.</p>

    <div class="card">
      <div class="section-title">Appointment Specifications</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #78716c; width: 140px;">Booking Ref:</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 600; color: #0d4a36;">#${data.referenceCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #78716c;">Date:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1c1917;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #78716c;">Inspection Time:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1c1917;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #78716c;">Viewing Format:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1c1917; text-transform: capitalize;">${data.meetingType.replace(/_/g, " ")}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #78716c;">Location / Access:</td>
          <td style="padding: 6px 0; color: #1c1917;">${data.propertyLocation}</td>
        </tr>
        ${data.gatePassCode ? `
        <tr>
          <td style="padding: 6px 0; color: #78716c;">Estate Security Code:</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0d4a36; background: #e6f4ea; padding-left: 6px; border-radius: 4px;">${data.gatePassCode}</td>
        </tr>` : ""}
      </table>
    </div>

    ${data.meetingUrl ? `
    <div style="margin: 20px 0; text-align: center;">
      <a href="${data.meetingUrl}" class="btn" target="_blank">Join Virtual Tour (Google Meet)</a>
    </div>` : ""}

    <div class="card">
      <div class="section-title">Assigned Luxury Closer</div>
      <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #1c1917;">${data.assignedBrokerName}</p>
      <p style="margin: 0; font-size: 12px; color: #78716c;">Senior Luxury Real Estate Advisor • Spacia Advisory Group</p>
      ${data.assignedBrokerPhone ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #0d4a36;">Direct: ${data.assignedBrokerPhone}</p>` : ""}
    </div>

    ${data.notes ? `
    <div style="font-size: 12px; color: #78716c; margin-top: 16px; border-left: 2px solid #0d4a36; padding-left: 12px;">
      <strong>Note:</strong> ${data.notes}
    </div>` : ""}
  `;

  const html = wrapLuxuryEmail(subject, bodyContent);
  const text = `Spacia - Viewing Confirmed: ${data.propertyTitle}\nRef: #${data.referenceCode}\nDate: ${formattedDate} (${formattedTime})\nLocation: ${data.propertyLocation}\nCloser: ${data.assignedBrokerName}\nSecurity Code: ${data.gatePassCode || "Standard access"}`;

  return { subject, html, text };
}

/**
 * 2. PROSPECT: Viewing Reminder (24h or 1h before)
 */
export function renderProspectViewingReminder(data: ProspectReminderData): { subject: string; html: string; text: string } {
  const formattedDate = new Date(data.scheduledStartAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(data.scheduledStartAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const windowLabel = data.reminderWindow === "1h" ? "in 1 Hour" : "Tomorrow";
  const subject = `Reminder: Your Property Inspection ${windowLabel} at ${formattedTime} (${data.referenceCode})`;

  const bodyContent = `
    <h1 style="font-size: 20px; font-weight: 700; color: #0d4a36; margin: 0 0 8px 0;">Upcoming Property Inspection Reminder</h1>
    <p style="font-size: 14px; color: #57534e; margin: 0 0 20px 0;">Dear ${data.leadName}, this is a reminder for your upcoming walkthrough of <strong>${data.propertyTitle}</strong> scheduled for <strong>${formattedDate} at ${formattedTime}</strong>.</p>

    <div class="card">
      <div class="section-title">Viewing Briefing & Access</div>
      <p style="font-size: 13px; margin: 0 0 6px 0;"><strong>Address:</strong> ${data.propertyLocation}</p>
      ${data.gatePassCode ? `<p style="font-size: 13px; margin: 0 0 6px 0;"><strong>Gate Clearance Pass:</strong> <span style="font-family: monospace; font-weight: 700; color: #0d4a36;">${data.gatePassCode}</span> (Show at estate security)</p>` : ""}
      <p style="font-size: 13px; margin: 0;"><strong>Closer on-site:</strong> ${data.assignedBrokerName}</p>
    </div>

    ${data.meetingUrl ? `
    <div style="margin: 20px 0; text-align: center;">
      <a href="${data.meetingUrl}" class="btn" target="_blank">Access Virtual Inspection Room</a>
    </div>` : ""}

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${data.confirmationActionUrl || "#"}" class="btn">I Will Be Attending</a>
    </div>
    <p style="text-align: center; font-size: 11px; color: #a8a29e; margin: 0;">Need to reschedule? Reply directly to this email or call your advisor.</p>
  `;

  const html = wrapLuxuryEmail(subject, bodyContent);
  const text = `Spacia Viewing Reminder: ${data.propertyTitle}\nTime: ${formattedDate} at ${formattedTime}\nAddress: ${data.propertyLocation}\nCloser: ${data.assignedBrokerName}\nGate Pass: ${data.gatePassCode || "Standard Access"}`;

  return { subject, html, text };
}

/**
 * 3. COMPANY / BROKERAGE: New Appointment Alert with Lead Context, Property Context & AI Summary
 */
export function renderCompanyNewAppointmentAlert(data: CompanyAppointmentData): { subject: string; html: string; text: string } {
  const formattedDate = new Date(data.meetingDetails.scheduledStartAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(data.meetingDetails.scheduledStartAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const scoreBadgeClass = data.leadContext.score >= 85 ? "badge-hot" : "badge-warm";
  const subject = `[New Viewing Booked] ${data.leadContext.name} (${data.leadContext.scoreCategory} ${data.leadContext.score}/100) — ${data.propertyContext.title}`;

  const bodyContent = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <h1 style="font-size: 20px; font-weight: 700; color: #0d4a36; margin: 0;">New Appointment Secured</h1>
      <span class="${scoreBadgeClass}">${data.leadContext.scoreCategory} (${data.leadContext.score}/100)</span>
    </div>
    <p style="font-size: 13px; color: #57534e; margin: 0 0 20px 0;">An inspection has been booked by an autonomously qualified prospect via Spacia.</p>

    <!-- 1. LEAD CONTEXT -->
    <div class="card">
      <div class="section-title">1. Lead Context (BANT Qualification)</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr>
          <td style="padding: 4px 0; color: #78716c; width: 140px;">Prospect:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #1c1917;">${data.leadContext.name} (${data.leadContext.phone})</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Email:</td>
          <td style="padding: 4px 0; color: #1c1917;">${data.leadContext.email}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Purchasing Budget:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #0d4a36;">${data.leadContext.budget}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Transaction Timeline:</td>
          <td style="padding: 4px 0; color: #1c1917;">${data.leadContext.timeline}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Authority Readiness:</td>
          <td style="padding: 4px 0; color: #1c1917;">${data.leadContext.decisionReadiness}</td>
        </tr>
        ${data.leadContext.buyingCatalyst ? `
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Motivation Catalyst:</td>
          <td style="padding: 4px 0; font-style: italic; color: #44403c;">"${data.leadContext.buyingCatalyst}"</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- 2. PROPERTY CONTEXT -->
    <div class="card">
      <div class="section-title">2. Property Context</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr>
          <td style="padding: 4px 0; color: #78716c; width: 140px;">Property Title:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #1c1917;">${data.propertyContext.title}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Location:</td>
          <td style="padding: 4px 0; color: #1c1917;">${data.propertyContext.location}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Asking Valuation:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #0d4a36;">${data.propertyContext.price}</td>
        </tr>
        ${data.propertyContext.commission ? `
        <tr>
          <td style="padding: 4px 0; color: #78716c;">Broker Commission:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #166534;">${data.propertyContext.commission} (LASRERA compliant)</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- 3. AI CALL SUMMARY & INTENT -->
    <div class="card" style="border-left: 3px solid #0d4a36;">
      <div class="section-title">3. AI Underwriting & Call Synthesis</div>
      <p style="font-size: 12px; margin: 0 0 10px 0; line-height: 1.5; color: #292524;">
        <strong>Autonomous Synthesis:</strong> ${data.aiSummary.synthesis}
      </p>
      <div style="font-size: 12px; margin-bottom: 8px;">
        <strong>Buyer Sentiment:</strong> <span style="text-transform: uppercase; font-weight: 700; color: #0d4a36;">${data.aiSummary.buyerSentiment}</span>
      </div>
      ${data.aiSummary.keyRequirements?.length ? `
      <div style="font-size: 12px; margin-bottom: 8px;">
        <strong>Key Requirements:</strong>
        <ul style="margin: 4px 0; padding-left: 20px; color: #57534e;">
          ${data.aiSummary.keyRequirements.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      </div>` : ""}
      ${data.aiSummary.objectionsResolved.length ? `
      <div style="font-size: 12px; margin-bottom: 8px;">
        <strong>Resolved Inquiries:</strong>
        <ul style="margin: 4px 0; padding-left: 20px; color: #57534e;">
          ${data.aiSummary.objectionsResolved.map((o) => `<li>${o}</li>`).join("")}
        </ul>
      </div>` : ""}
      ${data.aiSummary.recommendedClosingStrategy ? `
      <div style="font-size: 12px; background: #fefce8; padding: 8px 12px; border-radius: 4px; border: 1px solid #fef08a; color: #713f12;">
        <strong>Strategy Directive:</strong> ${data.aiSummary.recommendedClosingStrategy}
      </div>` : ""}
    </div>

    <!-- 4. APPOINTMENT SCHEDULE & ACTIONS -->
    <div style="margin: 20px 0; padding: 14px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; font-size: 12px;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #166534;">
        📅 Scheduled for: ${formattedDate} at ${formattedTime}
      </p>
      <p style="margin: 0; color: #15803d;">
        Assigned Lead Closer: <strong>${data.meetingDetails.assignedCloser}</strong>
      </p>
      ${data.meetingDetails.meetingUrl ? `
      <p style="margin: 6px 0 0 0;">
        <a href="${data.meetingDetails.meetingUrl}" style="color: #0d4a36; font-weight: 600;" target="_blank">Join Meeting URL</a>
      </p>` : ""}
    </div>
  `;

  const html = wrapLuxuryEmail(subject, bodyContent);
  const text = `Spacia Company Alert: New Viewing Booked\nProspect: ${data.leadContext.name} (${data.leadContext.score}/100)\nProperty: ${data.propertyContext.title} (${data.propertyContext.price})\nDate: ${formattedDate} at ${formattedTime}\nCloser: ${data.meetingDetails.assignedCloser}\nSummary: ${data.aiSummary.synthesis}`;

  return { subject, html, text };
}
