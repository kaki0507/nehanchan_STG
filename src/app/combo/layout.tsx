// src/app/combo/layout.tsx
'use client';

import { AuthWrapper } from '@/components/AuthWrapper';

export default function ComboMakerLayout({ children }: { children: React.ReactNode }) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
