// /app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('tb_auth_token');
    if (token) {
      router.replace('/');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null; // Render nothing, useEffect will handle the redirect
}
