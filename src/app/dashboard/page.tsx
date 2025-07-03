
import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  // Redirect to the default page, which is now overview.
  // In a real app, this could be based on user preferences.
  redirect('/dashboard/overview');
}
