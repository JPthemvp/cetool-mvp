/**
 * GoPhish integration — phishing simulation for A.1 evidence.
 *
 * GoPhish is MIT-licensed, self-hosted. This module generates a pre-configured
 * campaign config the SME can import into their GoPhish instance, or we host
 * a shared GoPhish instance (one campaign per org, isolated by API key).
 *
 * The output of a GoPhish campaign is the evidence for A.1.4(a)(b):
 *   - % employees who clicked the phishing link
 *   - % who submitted credentials
 *   - % who reported the email
 *   - Completion of follow-up training for clickers
 *
 * GoPhish API: https://docs.getgophish.com/api-documentation
 */

export interface GophishCampaignConfig {
  name: string;
  template: string;
  landing_page: string;
  url: string;
  launch_date: string;
  send_by_date: string;
  smtp: { name: string };
  groups: Array<{ name: string }>;
}

/**
 * Generate a GoPhish campaign config for an org.
 * The campaign sends a simulated Singapore Cyber Safe phishing email
 * (aligned to the themes in the CSA e-learning quiz).
 */
export function buildGophishCampaign(opts: {
  orgName: string;
  orgDomain: string;
  launchDate?: Date;
}): GophishCampaignConfig {
  const launch = opts.launchDate ?? new Date(Date.now() + 86_400_000); // tomorrow
  const sendBy = new Date(launch.getTime() + 7 * 86_400_000); // 1 week window

  return {
    name: `CE Awareness Sim — ${opts.orgName} — ${launch.toISOString().slice(0, 10)}`,
    template: "CSA SG Cyber Safe — IT Security Alert",
    landing_page: "CSA SG Cyber Safe — Training Redirect",
    url: `https://phishsim.cetool.sg/${opts.orgDomain}`,
    launch_date: launch.toISOString(),
    send_by_date: sendBy.toISOString(),
    smtp: { name: "CE Tool Mailer" },
    groups: [{ name: opts.orgName }],
  };
}

/** Email template text — mirrors common Singapore IT-alert phishing themes. */
export const PHISH_EMAIL_TEMPLATE = `
Subject: [Action Required] Your SingPass/Corppass account needs verification

Dear {{.FirstName}},

We have detected unusual login activity on your corporate account.
Please verify your identity within 24 hours to avoid suspension.

→ Verify account: {{.URL}}

If you did not trigger this, contact IT immediately.

IT Security Team
{{.From}}
`.trim();

/** Landing page shown after a click — redirects to awareness training. */
export const PHISH_LANDING_HTML = `
<!DOCTYPE html>
<html lang="en">
<head><title>Security Awareness Training</title></head>
<body style="font-family: sans-serif; max-width: 640px; margin: 3rem auto; padding: 1rem;">
  <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:1.5rem;margin-bottom:2rem">
    <h2 style="color:#92400e;margin:0 0 0.5rem">⚠ This was a simulated phishing test</h2>
    <p style="color:#78350f;margin:0">
      You clicked a link in a simulated phishing email as part of your organisation's
      Cyber Essentials awareness programme. No credentials were captured.
    </p>
  </div>
  <h3>What to look for:</h3>
  <ul>
    <li>Urgent language ("within 24 hours", "account suspension")</li>
    <li>Generic greeting instead of your name</li>
    <li>Hover over links before clicking — the domain should match your IT team's</li>
    <li>Unexpected requests to verify identity via email</li>
  </ul>
  <p><strong>Next step:</strong> Complete the <a href="https://www.sgcybersafe.gov.sg/e-learning">CSA SG Cyber Safe e-learning</a> (15 minutes).</p>
</body>
</html>
`.trim();

/** CSA SG Cyber Safe e-learning — free, no login required. */
export const CSA_ELEARNING = {
  url: "https://www.sgcybersafe.gov.sg/e-learning",
  title: "SG Cyber Safe Employee e-Learning",
  description:
    "Free 15-minute course by CSA covering the four cyber hygiene tips. Completion generates a certificate that can be uploaded as A.1 evidence.",
  certificateInstructions:
    "After completing the course, screenshot or download the completion certificate. Upload it in the A.1 section of your CE assessment.",
  topics: [
    "Tip 1: Protect yourself from phishing",
    "Tip 2: Set strong passphrases and protect them",
    "Tip 3: Protect your corporate and/or personal devices",
    "Tip 4: Report cyber incidents",
  ],
};
