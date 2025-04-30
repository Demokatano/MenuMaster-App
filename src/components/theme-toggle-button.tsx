
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes"; // Use useTheme from next-themes
import { usePathname } from 'next/navigation'; // To detect admin route
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // Determine the effective theme for display/toggle logic (handle potential undefined initial theme)
  const currentDisplayTheme = theme === 'dark' || theme === 'user-dark-theme' ? 'dark' : 'light';

  const toggleUserTheme = () => {
    // Cycle between 'light' and 'user-dark-theme' for the user
    const nextTheme = currentDisplayTheme === 'light' ? 'user-dark-theme' : 'light';
    setTheme(nextTheme);
  };

  // Don't render the button on admin routes
  if (isAdminRoute) {
    return null;
  }

  // Ensure theme is defined before rendering based on it (for initial load)
  if (!theme) {
      return ( // Render a placeholder or null during initial load
          <Button
            variant="outline"
            size="icon"
            disabled
            className="h-9 w-9"
            aria-label="Loading theme toggle"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
         </Button>
      );
  }


  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleUserTheme} // Use the specific toggle function
            aria-label={currentDisplayTheme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
            className="h-9 w-9" // Adjust size to match other header buttons
          >
            {/* Conditionally render icons based on the effective theme */}
            <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${currentDisplayTheme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
            <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${currentDisplayTheme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
           {/* Use currentDisplayTheme for tooltip text */}
           <p>{currentDisplayTheme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
