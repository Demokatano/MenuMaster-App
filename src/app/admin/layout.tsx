
import type { ReactNode } from 'react';
import { AuthProvider } from "@/context/auth-context"; // Ensure AuthProvider wraps admin pages
import { ProductProvider } from "@/context/product-context"; // Import ProductProvider
// StoreSettingsProvider is removed from here, now wrapping in RootLayout

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* This is okay if RootLayout also has it, contexts can nest */}
      <ProductProvider> {/* Wrap with ProductProvider */}
        {/* Minimal layout for admin pages */}
        {children}
      </ProductProvider>
    </AuthProvider>
  );
}
