import { redirect } from 'next/navigation'

export default function DashboardDatabasesRedirectPage() {
  // Historical/alternate URL: keep working for users/bookmarks.
  redirect('/databases')
}
