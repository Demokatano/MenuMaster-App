
import type { ReactNode } from 'react';
import { AuthProvider } from "@/context/auth-context"; // Ensure AuthProvider wraps auth pages too

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
        {/* Minimal layout for auth pages */}
        {children}
    </AuthProvider>
  );
}

