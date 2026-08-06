import { redirect } from "next/navigation";

/** Assets section has been merged into /discover. */
export default function AssetsPage() {
  redirect("/discover");
}
