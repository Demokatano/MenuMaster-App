
"use client";

import React, { useState, useEffect } from "react"; // Ensure React is imported
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react"; // Import icon for the return button

// Updated schema to reflect "Nome" instead of "Login"
const loginSchema = z.object({
  login: z.string().min(1, "Nome é obrigatório"), // Keep name 'login' internally, but label it "Nome"
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginUser, isAdminLoggedIn, currentUser } = useAuth(); // Get currentUser as well
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsSubmitting(true);
    // loginUser handles the logic and toasts
    // Pass the name field value as the login identifier
    const success = loginUser(data.login, data.password);
    if (success) {
      // Redirect happens inside useEffect reacting to currentUser change
      // No explicit redirect needed here anymore
    } else {
      // Error toast is handled within loginUser
      setIsSubmitting(false); // Only set false if login failed
    }
  };

   // Redirect if admin is already logged in
    React.useEffect(() => {
        if (isAdminLoggedIn) {
            router.push('/admin'); // Redirect admin to their panel
        }
    }, [isAdminLoggedIn, router]);

     // Redirect if user successfully logs in -> Redirect to main menu ('/')
    React.useEffect(() => {
        if (currentUser) {
            router.push('/'); // Redirect user to home/main menu page
        }
    }, [currentUser, router]);

  // Prevent logged-in users/admins from seeing the login page directly
   if (currentUser || isAdminLoggedIn) {
     // You could show a loading spinner here while redirecting
     return null; // Or redirect immediately in useEffect
   }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com seu nome e senha.</CardDescription> {/* Updated description */}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="login" // Keep internal name as 'login'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel> {/* Display "Nome" to the user */}
                    <FormControl>
                      <Input placeholder="Seu nome de cadastro" {...field} /> {/* Updated placeholder */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-2 pt-4">
            <div className="w-full text-sm text-muted-foreground">
                <Link href="/forgot-password" className="underline hover:text-primary">
                    Esqueci minha senha
                </Link>
            </div>
             <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                 <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retornar ao Menu Principal
                 </Link>
             </Button>
            <div className="w-full text-center text-sm text-muted-foreground mt-2">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline hover:text-primary">
                Crie uma
              </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

