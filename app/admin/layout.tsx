/**
 * Admin layout — completely independent of the main app shell.
 * No StepGate, no Nav, no footer chrome.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
