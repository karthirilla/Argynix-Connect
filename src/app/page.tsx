// /app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is the main entry point.
    // The check in the DashboardLayout will handle redirecting to login if not authenticated.
    // If authenticated, it will show the dashboard content at '/'.
    // If the token is missing, we send the user to the login page.
    const token = localStorage.getItem('tb_auth_token');
    if (!token) {
      router.replace('/login');
    } else {
      // The dashboard layout will handle rendering the correct page.
      // We can just stay at the root.
    }
  }, [router]);

  // Render a loading state or null while the redirect logic runs.
  return null;
}
