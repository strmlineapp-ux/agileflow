
import { redirect } from 'next/navigation';

// This file is now redundant as the overview content is served by the dynamic route.
// Redirect to the canonical path to avoid duplicate content.
export default function LegacyOverviewPage() {
  redirect('/dashboard/overview');
}
