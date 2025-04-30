
"use client";

// Use next-themes for robust theme management, including system preference and SSR/hydration handling.
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname } from 'next/navigation'; // To detect admin routes

// --- Context Type ---
interface CustomThemeContextType {
  // We might not need custom functions if next-themes handles everything
  // theme: string | undefined; // Get current theme from next-themes
  // toggleTheme: () => void; // Use next-themes setTheme
}

// --- Create Context (Optional, might just use useNextTheme directly) ---
const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

// --- Provider Component ---
export const ThemeProvider = ({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) => {
  const pathname = usePathname();
  const { setTheme, theme: currentNextTheme } = useNextTheme(); // Get setTheme from the actual provider
   const [isClient, setIsClient] = useState(false); // Track client-side mounting

   useEffect(() => {
     setIsClient(true); // Component has mounted
   }, []);

  // Effect to switch theme based on route
  useEffect(() => {
     if (!isClient) return; // Only run on client after mount

     const isAdminRoute = pathname?.startsWith('/admin');

     if (isAdminRoute) {
         // console.log("[ThemeProvider] Admin route detected. Setting theme to 'dark'. Current:", currentNextTheme);
         // Force admin theme if not already set
         if (currentNextTheme !== 'dark') {
             setTheme('dark');
         }
     } else {
         // console.log("[ThemeProvider] Non-admin route detected. Ensuring theme is not 'dark'. Current:", currentNextTheme);
         // On non-admin routes, ensure it's not stuck on 'dark'
         // Revert to light or dark based on user preference (next-themes handles this)
         // If the current theme IS 'dark' (because we were just on admin), switch it
         // Defaulting to 'light' might be okay, or try 'system'
         if (currentNextTheme === 'dark') {
             // Let next-themes decide based on localStorage/system by setting 'system' or a default like 'light'
             setTheme('light'); // Or potentially 'system'
         }
     }
  }, [pathname, setTheme, currentNextTheme, isClient]); // Rerun when path or theme changes

  // The actual provider from next-themes
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};

// --- Custom Hook (Optional, might just use useNextTheme directly) ---
// export const useTheme = () => {
//   const context = useContext(CustomThemeContext);
//   const nextThemeContext = useNextTheme();
//   if (context === undefined || nextThemeContext === undefined) {
//     throw new Error("useTheme must be used within a ThemeProvider");
//   }
//    // Combine or expose what's needed
//    return { ...nextThemeContext /* , ...other custom values if needed */ };
// };

// --- Export useTheme directly from next-themes for simplicity ---
export { useTheme } from 'next-themes';

// --- Remove old localStorage helpers ---
// const LS_USER_THEME_KEY = "menuMasterUserTheme";
// type Theme = "light" | "dark";
// const getFromLocalStorage = ... (removed)
// const setInLocalStorage = ... (removed)

