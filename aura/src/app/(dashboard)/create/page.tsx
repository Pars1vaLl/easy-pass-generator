import { redirect } from "next/navigation";

/**
 * /create (no slug) redirects to /explore so the user can pick a style.
 * This removes the duplicate page that had the hooks-in-JSX bug.
 */
export default function CreatePage() {
  redirect("/explore");
}
