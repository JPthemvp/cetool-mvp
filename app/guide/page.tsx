import { redirect } from "next/navigation";

/** The Guide step has been merged into /prioritise. */
export default function GuidePage() {
  redirect("/prioritise");
}
