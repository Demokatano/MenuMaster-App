
import type { ReactNode } from 'react';
import { AuthProvider } from "@/context/auth-context";
import { ProductProvider } from "@/context/product-context"; // Needed for accessing completed orders
import { Header } from '@/components/header'; // Include Header for consistent navigation
import { Toaster } from '@/components/ui/toaster'; // Include Toaster

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
        <ProductProvider>
            <div className="flex min-h-screen flex-col">
                <Header /> {/* Add Header */}
                <main className="flex-1">
                    {children}
                </main>
                <Toaster /> {/* Add Toaster */}
            </div>
        </ProductProvider>
    </AuthProvider>
  );
}
