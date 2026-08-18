import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { Nav } from "@/components/nav";
import { StepFooter, StepGate, StepHeader, TestModeBanner } from "@/components/journey-ui";
import { themeScript } from "@/components/theme";

export const metadata: Metadata = {
  title: "Cyber Essentials Readiness Tool",
  description:
    "Free, non-intrusive cyber posture assessment for Singapore SMEs — every finding mapped to a CSA Cyber Essentials measure, prioritised by risk, and carried through to a submission-ready self-assessment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider>
          <StepGate />
          <TestModeBanner />
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
            <StepHeader />
            {children}
          </main>
          <StepFooter />
          <footer className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
            <div className="border-t border-brand-700/35 pt-6 text-xs leading-relaxed text-brand-200/70 space-y-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <a href="/training" className="hover:text-brand-200/90 underline-offset-2 hover:underline">Training Quiz</a>
                <a href="/certification" className="hover:text-brand-200/90 underline-offset-2 hover:underline">Certification Bodies</a>
                <a href="https://www.csa.gov.sg/our-programmes/cybersecurity-certification/cyber-essentials" target="_blank" rel="noreferrer" className="hover:text-brand-200/90 underline-offset-2 hover:underline">CSA Cyber Essentials ↗</a>
                <a href="https://www.surveymonkey.com/r/sgcybersafe-employee" target="_blank" rel="noreferrer" className="hover:text-brand-200/90 underline-offset-2 hover:underline">SGCybersafe Quiz ↗</a>
              </div>
              <p>
                Prototype. Framework content is modelled on CSA&apos;s published Cyber Essentials
                mark (V202503, as expanded 15 Apr 2025). This tool is not affiliated with CSA
                and does not itself confer certification — an appointed certification body
                performs the independent assessment.
              </p>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
