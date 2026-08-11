"use client";

/**
 * /invite/[token]
 *
 * Simulates a CSA-style invitation email. The token encodes the org name and
 * UEN in base64 so the link is self-contained — no server state needed.
 *
 * Token format (base64url-encoded JSON):
 *   { org?: string; uen?: string; sector?: string; ref?: string }
 *
 * Generate a link:
 *   btoa(JSON.stringify({ org: "Acme Pte Ltd", uen: "202312345A", sector: "finance" }))
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";

interface InvitePayload {
  org?: string;
  uen?: string;
  sector?: string;
  ref?: string;   // reference number shown in the email
  pathway?: string;
}

function decodeToken(token: string): InvitePayload {
  try {
    const json = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as InvitePayload;
  } catch {
    return {};
  }
}

const CSA_LOGO_SVG = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect width="120" height="40" rx="4" fill="#1E3A5F"/>
  <text x="10" y="26" font-family="Arial" font-size="11" font-weight="bold" fill="white">CSA Singapore</text>
</svg>`;

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { setOrg, beginJourney, setPathway } = useStore();
  const [payload, setPayload] = useState<InvitePayload>({});
  const [token, setToken] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<"email" | "accepting" | "done">("email");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      setPayload(decodeToken(t));
    });
  }, [params]);

  const ref = payload.ref ?? `CSA-CE-${token.slice(0, 8).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function accept() {
    setStep("accepting");
    // Pre-fill store with org details from the token
    if (payload.org || payload.uen) {
      setOrg({
        name: payload.org ?? "",
        uen: payload.uen ?? "",
        sector: (payload.sector as never) ?? "general",
      });
    }
    if (payload.pathway) {
      setPathway(payload.pathway as never);
    }
    beginJourney();
    setAccepted(true);
    setTimeout(() => {
      setStep("done");
      setTimeout(() => router.push("/onboard"), 1000);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-[#f4f4f6] flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-2xl">
        {/* Email chrome */}
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-200">
          {/* Email header bar */}
          <div className="bg-[#1E3A5F] px-6 py-4 flex items-center gap-3">
            <div dangerouslySetInnerHTML={{ __html: CSA_LOGO_SVG }} className="h-10 w-28" />
            <span className="ml-auto text-[11px] text-white/50 font-mono">Ref: {ref}</span>
          </div>

          {/* Email meta */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 text-[12px] text-gray-500 space-y-1">
            <p><span className="font-semibold text-gray-700">From:</span> noreply@csa.gov.sg</p>
            <p><span className="font-semibold text-gray-700">To:</span> {payload.org ? `${payload.org} — Authorised Contact` : "You"}</p>
            <p><span className="font-semibold text-gray-700">Subject:</span> <strong className="text-gray-800">Invitation to Complete Cyber Essentials Self-Assessment — Action Required</strong></p>
            <p><span className="font-semibold text-gray-700">Date:</span> {today}</p>
          </div>

          {/* Email body */}
          <div className="px-8 py-7 text-[14px] leading-relaxed text-gray-800 space-y-4">
            <p>Dear {payload.org ? `${payload.org} Representative` : "Sir / Madam"},</p>

            <p>
              The <strong>Cyber Security Agency of Singapore (CSA)</strong> is pleased to invite your organisation to complete
              the <strong>Cyber Essentials Mark self-assessment</strong> under the SG Cyber Safe Programme.
            </p>

            <p>
              Achieving the Cyber Essentials Mark demonstrates your organisation&apos;s commitment to
              foundational cybersecurity practices and may be required for certain government procurement
              and partnership eligibility.
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
              <p className="font-semibold text-gray-900 text-[13px] uppercase tracking-wide">Invitation Details</p>
              {payload.org && <p><span className="text-gray-500 w-36 inline-block">Organisation:</span> <strong>{payload.org}</strong></p>}
              {payload.uen && <p><span className="text-gray-500 w-36 inline-block">UEN:</span> <strong className="font-mono">{payload.uen}</strong></p>}
              <p><span className="text-gray-500 w-36 inline-block">Reference:</span> <strong className="font-mono">{ref}</strong></p>
              <p><span className="text-gray-500 w-36 inline-block">Framework:</span> Cyber Essentials Mark V202503</p>
              <p><span className="text-gray-500 w-36 inline-block">Deadline:</span> 30 days from date of this letter</p>
            </div>

            <p>
              The self-assessment covers <strong>9 measures and 75 clauses</strong> across asset management,
              secure configuration, patch management, malware protection, network security, access control,
              patch management, backup, and incident response.
            </p>

            <p>
              Your dedicated assessment session has been prepared. Click the button below to begin.
              Your organisation details have been pre-loaded — you will only need to complete the
              assessment questions and submit your results.
            </p>

            {/* CTA */}
            <div className="pt-2">
              {step === "email" && (
                <button
                  onClick={accept}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-6 py-3 text-[14px] font-semibold text-white shadow transition hover:bg-[#2a4f7c] active:scale-95"
                >
                  Accept Invitation &amp; Begin Assessment →
                </button>
              )}
              {step === "accepting" && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-[14px] font-semibold text-white">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Setting up your session…
                </div>
              )}
              {step === "done" && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-[14px] font-semibold text-white">
                  ✓ Redirecting to assessment…
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            <div className="text-[12px] text-gray-500 space-y-1">
              <p>
                This is a dedicated session link. Share it only with authorised personnel responsible
                for completing your organisation&apos;s self-assessment.
              </p>
              <p>
                If you believe you have received this in error, or did not expect this invitation,
                please contact <a href="mailto:enquiries@csa.gov.sg" className="underline text-[#1E3A5F]">enquiries@csa.gov.sg</a>.
              </p>
              <p className="pt-2 font-semibold text-gray-600">
                Cyber Security Agency of Singapore<br />
                SG Cyber Safe Programme Office
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#1E3A5F]/5 border-t border-gray-200 px-8 py-4 text-[11px] text-gray-400 text-center">
            This is an automated message. Do not reply to this email.
            <br />© {new Date().getFullYear()} Cyber Security Agency of Singapore. All rights reserved.
          </div>
        </div>

        {/* Below-email note */}
        <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-50 px-5 py-3 text-[12px] text-amber-700">
          <strong>Demo note:</strong> This simulates a CSA invite email. In production, this link would be emailed directly to your authorised contact.
          To generate a real invite link: <code className="rounded bg-amber-100 px-1">btoa(JSON.stringify({"{"}"org":"Acme Pte Ltd","uen":"202312345A"{"}"}))</code>
        </div>
      </div>
    </div>
  );
}
