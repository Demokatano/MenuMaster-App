
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import { StoreSettingsProvider } from '@/context/store-settings-context'; // Import StoreSettingsProvider
import { ThemeProvider } from '@/context/theme-context'; // Import ThemeProvider

export const metadata: Metadata = {
  title: 'MenuMaster',
  description: 'Virtual menu application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ThemeProvider will handle applying 'user-light-theme' or 'user-dark-theme'
  // or 'dark' based on its internal logic now.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AuthProvider>
          <StoreSettingsProvider>
            {/* ThemeProvider now determines which class ('dark' or 'user-light/dark-theme') to apply */}
            <ThemeProvider
              attribute="class" // Apply theme class to <html> element
              defaultTheme="system" // Default to system preference
              enableSystem // Allow system preference detection
              // Define custom themes if needed, though we use CSS vars directly
              // themes={['user-light-theme', 'user-dark-theme', 'dark']}
            >
              {children}
            </ThemeProvider>
            <Toaster />
          </StoreSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

