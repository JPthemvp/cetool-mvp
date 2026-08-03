/**
 * Plain English for people who do not work in security.
 *
 * Simple mode is not "technical mode with smaller words". It is a different
 * vocabulary. An SME owner does not know what SPF is, does not want to, and
 * should not have to in order to decide whether to act. Telling them "No SPF
 * record" transfers the problem to them; telling them "Anyone can send email
 * that looks like it came from you" lets them make a business decision.
 *
 * So every technical term has a layman equivalent here, and Simple mode shows
 * only these. Measure numbers, clause codes, protocol names and header names all
 * belong to Technical mode. Nothing is dumbed down — the same finding is
 * reported — it is described by its consequence rather than its mechanism.
 *
 * Rule of thumb applied throughout: if you could not say it to a shop owner
 * without them asking a follow-up question, it belongs in Technical.
 */

import type { MeasureId } from "./ce-framework";

/** Measures, named by what they protect rather than by their category label. */
export const PLAIN_MEASURE: Record<MeasureId, { name: string; blurb: string }> = {
  "A.1": {
    name: "Your staff",
    blurb: "Whether the people who work for you can spot a scam and know who to tell.",
  },
  "A.2": {
    name: "Your computers and software",
    blurb: "Knowing what you own, and that none of it is too old to be safe.",
  },
  "A.3": {
    name: "Your important information",
    blurb: "Knowing what matters, where it is kept, and that it cannot be read if a laptop is stolen.",
  },
  "A.4": {
    name: "Protection from viruses",
    blurb: "Software that blocks harmful programs before they can run.",
  },
  "A.5": {
    name: "Who can log in",
    blurb: "Making sure only the right people have accounts, and that a stolen password is not enough.",
  },
  "A.6": {
    name: "How things are set up",
    blurb: "Changing the settings that computers and services arrive with, which are set for convenience rather than safety.",
  },
  "A.7": {
    name: "Keeping things up to date",
    blurb: "Installing the fixes that close holes attackers already know about.",
  },
  "A.8": {
    name: "Backups",
    blurb: "Having a copy of everything you could not trade without, kept somewhere an attacker cannot reach.",
  },
  "A.9": {
    name: "If something goes wrong",
    blurb: "Knowing who decides, who to call, and what to switch off first.",
  },
};

/** Categories, likewise. */
export const PLAIN_CATEGORY: Record<string, string> = {
  assets: "What you have",
  secure: "Keeping it safe",
  update: "Keeping it current",
  backup: "Being able to recover",
  respond: "Being ready",
};

export interface PlainFinding {
  title: string;
  detail: string;
}

/**
 * Scan findings, described by consequence.
 *
 * Keyed by checkId and by pass/fail, because the layman phrasing of a good
 * result is not the negation of the bad one — "you are protected from people
 * faking your email" reads very differently from "no SPF record".
 */
export const PLAIN_CHECK: Record<string, { pass: PlainFinding; fail: PlainFinding }> = {
  "email.spf": {
    pass: {
      title: "Nobody can easily fake email from your business",
      detail: "You have told the internet which computers are allowed to send email as you, so fakes get rejected.",
    },
    fail: {
      title: "Anyone can send email pretending to be your business",
      detail:
        "There is nothing stopping a stranger emailing your customers or staff from what looks like your address. This is how fake invoices get paid.",
    },
  },
  "email.dmarc": {
    pass: {
      title: "Fake email claiming to be you gets blocked",
      detail: "You have told other mail providers to reject messages that fail your checks, rather than just noting them.",
    },
    fail: {
      title: "Fake email claiming to be you is not blocked",
      detail:
        "Even if someone spots a message is fake, nothing tells their mail provider to throw it away. This is the most common way small businesses get caught up in invoice fraud.",
    },
  },
  "email.dkim": {
    pass: {
      title: "Your email carries a tamper-proof signature",
      detail: "Messages you send can be checked for tampering on the way.",
    },
    fail: {
      title: "Your email may not carry a tamper-proof signature",
      detail: "We could not find one. Your email provider may still be doing this - worth asking whoever set it up.",
    },
  },
  "dns.caa": {
    pass: {
      title: "Only your chosen suppliers can issue security certificates for you",
      detail: "This stops someone else obtaining a certificate in your name.",
    },
    fail: {
      title: "Any supplier could issue a security certificate in your name",
      detail:
        "You can restrict this to the ones you actually use. It is a small change with your domain provider.",
    },
  },
  "tls.available": {
    pass: {
      title: "Your website is encrypted",
      detail: "Information visitors type into your site is scrambled on the way, so it cannot be read in transit.",
    },
    fail: {
      title: "Your website is not encrypted",
      detail:
        "Anything a visitor types - names, phone numbers, card details - travels in a form anyone on the same network can read.",
    },
  },
  "tls.valid": {
    pass: { title: "Your website's security certificate is trusted", detail: "Visitors see no warnings." },
    fail: {
      title: "Visitors see a security warning on your website",
      detail:
        "Their browser cannot confirm the site is really yours. Customers either leave, or they learn to click past warnings - which is worse.",
    },
  },
  "tls.expiry": {
    pass: { title: "Your website's certificate is in date", detail: "Nothing to do for now." },
    fail: {
      title: "Your website's certificate is expiring or expired",
      detail: "When it lapses, most visitors will see a full-page warning and many will not continue.",
    },
  },
  "tls.legacy": {
    pass: {
      title: "Your website only uses modern, safe encryption",
      detail: "The older methods with known weaknesses are switched off.",
    },
    fail: {
      title: "Your website still accepts outdated encryption",
      detail:
        "Older methods with known weaknesses are still allowed. Whoever runs your website can switch them off.",
    },
  },
  "web.https-redirect": {
    pass: { title: "Visitors are always sent to the secure version of your site", detail: "" },
    fail: {
      title: "Visitors can end up on an unprotected version of your site",
      detail: "Anyone typing your address without the secure prefix stays unprotected.",
    },
  },
  "web.hsts": {
    pass: { title: "Browsers remember to always use the secure version", detail: "" },
    fail: {
      title: "Browsers are not told to always use the secure version",
      detail: "A small setting on your website closes a gap on the very first visit.",
    },
  },
  "web.csp": {
    pass: { title: "Your website limits what code can run on it", detail: "" },
    fail: {
      title: "Your website does not limit what code can run on it",
      detail:
        "This is the main protection against someone injecting code into your pages to steal what customers type.",
    },
  },
  "web.xcto": {
    pass: { title: "Your website tells browsers not to guess file types", detail: "" },
    fail: {
      title: "Your website lets browsers guess file types",
      detail: "A minor setting, but it can let a harmless-looking upload be treated as a program.",
    },
  },
  "web.frame": {
    pass: { title: "Your website cannot be hidden inside someone else's page", detail: "" },
    fail: {
      title: "Your website can be hidden inside someone else's page",
      detail: "This is used to trick people into clicking things they did not intend to.",
    },
  },
  "web.referrer": {
    pass: { title: "Your website does not leak internal addresses to other sites", detail: "" },
    fail: {
      title: "Your website may leak internal addresses to other sites",
      detail: "Minor, but easy to switch on.",
    },
  },
  "web.banner": {
    pass: { title: "Your website does not advertise what software it runs", detail: "" },
    fail: {
      title: "Your website advertises exactly what software it runs",
      detail:
        "That tells an attacker which known weaknesses to try first. Whoever runs your site can turn this off.",
    },
  },
  "web.cookies": {
    pass: { title: "Your website protects the small files it stores in browsers", detail: "" },
    fail: {
      title: "Your website stores files in browsers without full protection",
      detail: "These can hold a visitor's session, so they are worth protecting.",
    },
  },
  "discovery.ct": {
    pass: { title: "We found no other websites registered under your name", detail: "" },
    fail: {
      title: "There are other websites registered under your business name",
      detail:
        "Some may be old test sites nobody remembers. Those are the ones that never get updated, and they are a way in. Each one needs to be on your equipment list, or shut down.",
    },
  },
};

/** Section headings on the scan results. */
export const PLAIN_GROUP: Record<string, string> = {
  dns: "Your business name on the internet",
  email: "Email pretending to be you",
  tls: "Whether your website is protected",
  web: "How your website is set up",
  exposure: "Files that should not be public",
};

export function plainFinding(
  checkId: string,
  status: string,
): PlainFinding | undefined {
  const entry = PLAIN_CHECK[checkId];
  if (!entry) return undefined;
  return status === "pass" ? entry.pass : entry.fail;
}

export function plainGroup(group: string): string {
  return PLAIN_GROUP[group] ?? group;
}

export function plainMeasure(id: MeasureId): { name: string; blurb: string } {
  return PLAIN_MEASURE[id];
}
