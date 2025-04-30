
"use client";

import { useState } from "react";
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

const adminSignupSchema = z.object({
  login: z.string().min(3, "Login de admin deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha de admin deve ter pelo menos 6 caracteres"),
  // Add confirmPassword if needed:
  // confirmPassword: z.string(),
}).refine((data) => {
  // Add password confirmation validation if confirmPassword field exists
  // return data.password === data.confirmPassword;
  return true; // Placeholder if no confirmation needed yet
}, {
  // message: "As senhas não coincidem",
  // path: ["confirmPassword"], // path of error
});

type AdminSignupFormValues = z.infer<typeof adminSignupSchema>;

export default function AdminSignupPage() {
  const { signupAdmin } = useAuth(); // Assuming signupAdmin exists in context
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminSignupFormValues>({
    resolver: zodResolver(adminSignupSchema),
    defaultValues: {
      login: "",
      password: "",
      // confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: AdminSignupFormValues) => {
    setIsSubmitting(true);
    // In a real app, signupAdmin should handle hashing the password securely on the backend
    const success = signupAdmin(data.login, data.password); // Pass plain password for now

    if (success) {
      toast({
          title: "Administrador Criado",
          description: "Nova conta de administrador criada com sucesso. Faça login.",
      });
      // Redirect to the admin login page after successful signup
      router.push("/admin");
    } else {
      // Error toast is handled within signupAdmin (e.g., login already exists)
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Criar Conta de Administrador</CardTitle>
          <CardDescription>Preencha os campos abaixo para criar um novo administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login do Administrador</FormLabel>
                    <FormControl>
                      <Input placeholder="Login único para o admin" {...field} />
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
                    <FormLabel>Senha do Administrador</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Senha segura para o admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add Confirm Password field if needed */}
              {/* <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <Button
                type="submit"
                className="w-full"
                disabled={!form.formState.isValid || isSubmitting}
              >
                {isSubmitting ? "Criando..." : "Criar Administrador"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2 border-t pt-4 mt-4">
           <Button variant="outline" size="sm" className="w-full" asChild>
               <Link href="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login Admin
               </Link>
           </Button>
           <Button variant="link" size="sm" className="w-full" asChild>
               <Link href="/">
                  Ir para o Menu Principal
               </Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
