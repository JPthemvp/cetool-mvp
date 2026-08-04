"use client";

import { useStore } from "@/components/store";
import { Button, Card, EmptyState, Pill, SectionTitle, Stat } from "@/components/ui";
import type { DiscoveredAsset } from "@/lib/scan";

const KIND_LABEL: Record<DiscoveredAsset["kind"], string> = {
  domain: "Domain",
  host: "Host",
  mx: "Mail server",
  nameserver: "Name server",
  ip: "IP address",
  service: "Service",
};

/**
 * The classes of asset Cyber Essentials A.2.4(b) expects to see in the inventory.
 * External discovery can only ever populate the internet-facing ones, so the rest
 * are shown as an explicit to-do rather than quietly omitted.
 */
const INVENTORY_CLASSES = [
  { label: "Internet-facing services", discoverable: true },
  { label: "Domains and DNS", discoverable: true },
  { label: "Mail infrastructure", discoverable: true },
  { label: "End-user devices (laptops, desktops)", discoverable: false },
  { label: "Mobile and portable devices", discoverable: false },
  { label: "Network devices (firewalls, routers, switches)", discoverable: false },
  { label: "Servers", discoverable: false },
  { label: "IoT and non-standard computing devices", discoverable: false },
  { label: "Business applications and SaaS", discoverable: false },
];

export default function AssetsPage() {
  const { scan, ready } = useStore();
  const assets = scan?.assets ?? [];

  const byKind = (Object.keys(KIND_LABEL) as DiscoveredAsset["kind"][])
    .map((k) => ({ kind: k, items: assets.filter((a) => a.kind === k) }))
    .filter((g) => g.items.length > 0);

  function exportInventory() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Asset", "Type", "Detail", "Source", "Owner", "Location", "End of support", "Authorised on"],
      ...assets.map((a) => [
        a.value,
        KIND_LABEL[a.kind],
        a.detail ?? "",
        "Automated discovery",
        "",
        "",
        "",
        "",
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-inventory-${scan?.domain ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 02 · Assets"
        title="Your asset inventory, started for you"
        lead="A.2.4(a) requires an up-to-date inventory of hardware and software, and CSA accepts a spreadsheet. Discovery fills in the internet-facing rows — the part most organisations overlook, since subdomains provisioned by vendors are easily forgotten. The remainder is captured by a physical walkthrough."
      />

      {!scan && ready && (
        <EmptyState
          title="Nothing discovered yet"
          body="Run a scan first and the assets we can see from outside will be listed here, ready to export as the starting point for your inventory."
          action={{ label: "Go to Discover", href: "/discover" }}
        />
      )}

      {scan && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Assets discovered" value={assets.length} />
            <Stat label="Asset classes covered" value={`${byKind.length} / ${INVENTORY_CLASSES.length}`} />
            <Stat
              label="Clause"
              value="A.2.4(a)"
              hint="Inventory of hardware and software"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-brand-700/30 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-white/90">Discovered assets</h3>
                <Button variant="subtle" onClick={exportInventory} className="!px-3 !py-1.5 !text-xs">
                  Export as inventory CSV
                </Button>
              </div>

              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-700/30 text-[11px] uppercase tracking-wide text-brand-200/70">
                      <th className="px-5 py-2.5 font-medium">Asset</th>
                      <th className="px-5 py-2.5 font-medium">Type</th>
                      <th className="px-5 py-2.5 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a, i) => (
                      <tr key={`${a.kind}-${a.value}-${i}`} className="border-b border-ink-800/50 last:border-0">
                        <td className="px-5 py-3 font-mono text-[13px] text-white/90">{a.value}</td>
                        <td className="px-5 py-3">
                          <Pill>{KIND_LABEL[a.kind]}</Pill>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-brand-100/60">{a.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-white/90">
                What the inventory still needs
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-brand-100/60">
                A.2.4(b) lists the asset classes in scope. External discovery reaches three
                of them. The remainder require a physical walkthrough, which is both the quickest approach and what an assessor will expect.
              </p>
              <ul className="mt-4 space-y-2">
                {INVENTORY_CLASSES.map((c) => (
                  <li key={c.label} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        c.discoverable ? "bg-emerald-400" : "bg-brand-600/60"
                      }`}
                    />
                    <span className={c.discoverable ? "text-brand-50" : "text-brand-100/60"}>
                      {c.label}
                      {c.discoverable && (
                        <span className="ml-1.5 text-[11px] text-emerald-400/80">discovered</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-brand-700/30 pt-4 text-[13px] leading-relaxed text-brand-100/60">
                The export gives you the columns A.2.4(c) and A.2.4(d) ask for — owner,
                location, end-of-support date, authorisation date — with the discovered rows
                already filled in.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
