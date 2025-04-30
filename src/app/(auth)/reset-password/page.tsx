
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LockKeyhole, User } from "lucide-react"; // Added User icon

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"], // Apply error to confirmation field
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { updateUser, users } = useAuth(); // Get updateUser and users list
  const router = useRouter();
  const searchParams = useSearchParams(); // Get query parameters
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidUser, setIsValidUser] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null); // State to store user login

  // Get user ID from query param and fetch user data
  useEffect(() => {
    const id = searchParams.get("userId");
    if (id) {
      const user = users.find(u => u.id === id);
       if (user) {
           setUserId(id);
           setUserLogin(user.login); // Store the login name
           setIsValidUser(true);
       } else {
            toast({ title: "Erro", description: "Usuário inválido ou link expirado.", variant: "destructive" });
            router.push('/login'); // Redirect if user ID is invalid
       }
    } else {
         toast({ title: "Erro", description: "Link de redefinição inválido.", variant: "destructive" });
         router.push('/login'); // Redirect if no user ID
    }
  }, [searchParams, users, toast, router]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!userId) {
        toast({ title: "Erro", description: "ID do usuário não encontrado.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const userToUpdate = users.find(u => u.id === userId);

    if (!userToUpdate) {
         toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
         setIsSubmitting(false);
         return;
    }

     // Pass necessary data for password reset, including the reset flag
     const updatePayload = {
        id: userId,
        // Include dummy values for required fields not being changed here,
        // or modify updateUser to handle partial updates more gracefully
        name: userToUpdate.name,
        email: userToUpdate.email,
        address: userToUpdate.address,
        cep: userToUpdate.cep,
        houseNumber: userToUpdate.houseNumber,
        phone: userToUpdate.phone,
        cpf: userToUpdate.cpf, // Include CPF if it exists
        // Set the new password and indicate it's a reset
        newPassword: data.newPassword,
        isPasswordReset: true, // Add the flag
     };

    // --- Call updateUser with the reset flag ---
    // updateUser should handle the logic based on isPasswordReset
    const success = updateUser(updatePayload);

    if (success) {
      // Toast is handled within updateUser
      setTimeout(() => {
        router.push("/login"); // Redirect to login page
      }, 2000); // Delay for toast
    } else {
       // Error toast handled within updateUser
       setIsSubmitting(false); // Keep the form if update fails
    }
  };

   if (!isValidUser) {
     // Show loading or nothing while validating/redirecting
     return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <p className="text-muted-foreground">Verificando link...</p>
        </div>
     );
   }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <LockKeyhole className="h-5 w-5" />
             Redefinir Senha
          </CardTitle>
          <CardDescription>Digite e confirme sua nova senha.</CardDescription>
            {/* Display User Login */}
           {userLogin && (
               <div className="pt-2 text-sm text-muted-foreground flex items-center gap-1">
                   <User className="h-4 w-4" />
                   <span>Seu nome de login é: <strong>{userLogin}</strong></span>
               </div>
           )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
           <Button variant="outline" size="sm" className="w-full" asChild>
               <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancelar e Voltar para Login
               </Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

