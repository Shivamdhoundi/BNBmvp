import { redirect } from "next/navigation";

export default function LandingPage() {
  // As an internal operations tool, the root simply redirects to the dashboard.
  // The dashboard layout/middleware will handle redirecting unauthenticated users to /sign-in
  redirect("/dashboard");
}
