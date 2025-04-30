
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = "0000"; // The required password - Updated to 0000

export function AdminPasswordDialog({ isOpen, onClose }: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      toast({
        title: "Acesso Permitido",
        description: "Redirecionando para a página de administração.",
      });
      router.push("/admin"); // Redirect to admin page
      onClose(); // Close the dialog
    } else {
      toast({
        title: "Senha Incorreta",
        description: "A senha de administrador está incorreta.",
        variant: "destructive",
      });
      setPassword(""); // Clear the password field
    }
  };

  const handleCancel = () => {
     setPassword(""); // Clear password on cancel
     onClose();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Acesso Restrito</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, insira a senha de administrador para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="admin-password" >
                 Senha
                 </Label>
                <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="Digite a senha"
                />
            </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Confirmar
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
