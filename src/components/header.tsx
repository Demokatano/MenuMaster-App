
"use client";

import React, { useState, useEffect } from "react"; // Import React and useEffect
import Link from "next/link";
import { Search, UserCircle, LogOut, UserPlus, ShieldAlert, ShieldCheck, History, Edit } from "lucide-react"; // Added History and Edit icons
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProductContext } from "@/context/product-context";
import { useAuth } from "@/context/auth-context";
import { AdminPasswordDialog } from "./admin-password-dialog";
import { ThemeToggleButton } from "./theme-toggle-button"; // Import ThemeToggleButton
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation"; // Import useRouter

export function Header() {
  const { setSearchTerm } = useProductContext();
  const { currentUser, isAdminLoggedIn, logoutUser, logoutAdmin } = useAuth();
  const [isAdminPasswordDialogOpen, setIsAdminPasswordDialogOpen] = useState(false);
  const router = useRouter(); // Initialize router

  // This state helps manage UI updates after logout/login transitions
  const [isClientReady, setIsClientReady] = useState(false);
  useEffect(() => {
      setIsClientReady(true); // Component has mounted on the client
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAdminAccessClick = () => {
     if (isAdminLoggedIn) {
        // If admin is already logged in, navigate to admin page
        router.push("/admin");
     } else {
        setIsAdminPasswordDialogOpen(true);
     }
  };

  const handleLogout = () => {
    // User logout is handled here
    if (currentUser) {
        logoutUser();
        // Optionally redirect to home page after user logout
        router.push('/'); // Redirect to home on logout
    }
    // Admin logout is handled on the /admin page itself via its own button
  }

   // Render nothing until client-side hydration is complete to avoid mismatches
   if (!isClientReady) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-4">
                {/* Skeleton or placeholder for header */}
                 <div className="h-8 w-32 bg-muted rounded"></div>
                 <div className="h-9 w-64 bg-muted rounded"></div>
                 <div className="flex gap-2">
                     <div className="h-9 w-20 bg-muted rounded"></div>
                     <div className="h-9 w-20 bg-muted rounded"></div>
                     <div className="h-9 w-9 bg-muted rounded-full"></div> {/* Skeleton for Theme Button */}
                 </div>
            </div>
        </header>
     );
   }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-foreground mr-4 shrink-0">
            MenuMaster
          </Link>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produto..."
              className="pl-10 h-9"
              onChange={handleSearchChange}
              aria-label="Buscar produto"
            />
          </div>

          <div className="flex items-center gap-2">
             {/* Admin Access Button - Show only if NO user is logged in */}
             {!currentUser && !isAdminLoggedIn && (
                 <Button
                    variant={"outline"}
                    size="sm"
                    onClick={handleAdminAccessClick}
                    title={"Acesso ao Administrador"}
                 >
                     <ShieldAlert className="h-4 w-4" />
                     <span className="hidden md:inline ml-2">Admin</span>
                 </Button>
             )}

            {currentUser ? (
              // -------- User is logged in ---------
               <>
                  <Button variant="outline" size="sm" asChild>
                     <Link href="/order-history">
                        <History className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Histórico</span>
                     </Link>
                  </Button>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          {/* Optionally display user avatar or initials here */}
                          <UserCircle className="h-6 w-6" />
                       </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {currentUser.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                             <Link href="/profile/edit">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar Perfil</span>
                            </Link>
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                             <span>Sair</span>
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
               </>
            ) : isAdminLoggedIn ? (
               // -------- Admin is logged in ---------
                <>
                 <Button variant="secondary" size="sm" asChild>
                    <Link href="/admin">
                       <ShieldCheck className="h-4 w-4 md:mr-2" />
                       <span className="hidden md:inline">Painel Admin</span>
                    </Link>
                 </Button>
                  <Button variant="outline" size="sm" onClick={logoutAdmin}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair (Admin)
                  </Button>
                </>
            ) : (
               // -------- No one logged in ---------
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">
                       <UserCircle className="h-4 w-4 md:mr-2"/>
                      <span className="hidden md:inline">Entrar</span>
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                     <Link href="/signup">
                       <UserPlus className="h-4 w-4 md:mr-2"/>
                       <span className="hidden md:inline">Criar Conta</span>
                     </Link>
                  </Button>
                </>
            )}
             {/* Theme Toggle Button - Always visible */}
             <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Admin Password Dialog remains the same */}
      <AdminPasswordDialog
        isOpen={isAdminPasswordDialogOpen}
        onClose={() => setIsAdminPasswordDialogOpen(false)}
      />
    </>
  );
}
