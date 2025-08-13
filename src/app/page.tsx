import { redirect } from 'next/navigation'

export default function Home() {
  // Always redirect from the root to the login page.
  // The login page will handle redirecting authenticated users to the dashboard.
  redirect('/login')
}
