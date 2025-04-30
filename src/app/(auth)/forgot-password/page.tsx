
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

// Simple phone validation (allows digits, spaces, (), -)
const phoneRegex = /^[\d\s()-]+$/;

const forgotPasswordSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  phone: z.string()
    .min(10, "Telefone inválido (inclua DDD)") // Basic length check
    .regex(phoneRegex, "Telefone contém caracteres inválidos"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { users } = useAuth(); // Get the list of users
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    // Normalize inputs (e.g., remove extra spaces, case-insensitive comparison)
    const normalizedName = data.fullName.trim().toLowerCase();
    // Normalize phone: remove non-digits for comparison
    const normalizedPhone = data.phone.replace(/\D/g, '');

    // Find user matching normalized name AND normalized phone
    const userFound = users.find(user =>
      user.name.trim().toLowerCase() === normalizedName &&
      user.phone.replace(/\D/g, '') === normalizedPhone
    );

    if (userFound) {
      // --- Mock Success ---
      // In a real app, trigger a secure password reset flow (email/SMS link/code).
      // For this mock, show success and redirect to the reset password page.
      toast({
        title: "Verificação Bem-Sucedida",
        description: "Informações encontradas. Redirecionando para redefinição de senha.",
      });
      // You could potentially store the user ID temporarily or pass a token
      // sessionStorage.setItem('resetUserId', userFound.id); // Example
      setTimeout(() => {
        router.push(`/reset-password?userId=${userFound.id}`); // Redirect to reset password page with user ID (INSECURE MOCK)
      }, 2000); // Delay to allow user to read toast
    } else {
      // --- Failure ---
      toast({
        title: "Verificação Falhou",
        description: "Nome completo ou telefone não encontrado ou não corresponde a um usuário cadastrado.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>Confirme suas informações para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (com DDD)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? "Verificando..." : "Verificar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2 border-t pt-4">
             <Button variant="outline" size="sm" className="w-full" asChild>
                 <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                 </Link>
             </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
