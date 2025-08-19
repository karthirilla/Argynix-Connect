// /app/(dashboard)/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null; // Render nothing, useEffect will handle the redirect
}
