import { redirect } from "next/navigation";

/** The Monitor step has been removed. */
export default function MonitorPage() {
  redirect("/results");
}
