/**
 * Invite layout — no additional chrome; root layout provides StoreProvider and nav.
 * The invite page itself renders full-page so the nav becomes minimal context.
 */
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
