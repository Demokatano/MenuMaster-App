
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
import { isValidCPF } from "@/lib/validation/cpf"; // Import CPF validation helper
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon

const cepRegex = /^\d{5}-\d{3}$/; // Regex for 00000-000 format
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/; // Regex for XXX.XXX.XXX-XX format

const signupSchema = z.object({
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
  name: z.string().min(2, "Nome é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().regex(cpfRegex, "CPF inválido (formato: XXX.XXX.XXX-XX)")
    .refine(isValidCPF, "CPF inválido"), // Add refine for algorithm check
  address: z.string().min(5, "Endereço (Logradouro) é obrigatório"),
  cep: z.string().regex(cepRegex, "CEP inválido (formato: 00000-000)"),
  houseNumber: z.string().min(1, "Número da residência é obrigatório"),
  phone: z.string().min(8, "Telefone inválido"), // Basic validation
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signupUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      login: "",
      name: "",
      password: "",
      email: "",
      cpf: "", // Default CPF
      address: "",
      cep: "",
      houseNumber: "",
      phone: "",
    },
    mode: "onChange", // Enable button when form is valid
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    // Pass the plain password directly to the context function (for mock purposes)
    const success = signupUser({
        login: data.login,
        name: data.name,
        email: data.email,
        cpf: data.cpf, // Include CPF
        address: data.address,
        cep: data.cep,
        houseNumber: data.houseNumber,
        phone: data.phone,
        passwordPlain: data.password // Pass plain password here
    });

    if (success) {
      // Optionally redirect to login or another page after signup
      setTimeout(() => {
        router.push("/login"); // Redirect to login page after a short delay
      }, 1500); // Give time for the toast to be read
    } else {
        // Error toast handled within signupUser
        setIsSubmitting(false); // Only set submitting false if signup failed
    }
    // No need to setIsSubmitting(false) on success because of redirect
  };

  // Function to format CPF input
  const formatCPF = (value: string) => {
      const digits = value.replace(/\D/g, ''); // Remove non-digits
      if (digits.length <= 3) {
          return digits;
      } else if (digits.length <= 6) {
          return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      } else if (digits.length <= 9) {
          return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      } else {
          return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
      }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar uma conta de Usuario</CardTitle>
          <CardDescription>Preencha os campos abaixo para criar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu login único" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
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
                      <Input type="password" placeholder="Sua senha segura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* CPF Field */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXX.XXX.XXX-XX"
                        {...field}
                        onChange={(e) => {
                            field.onChange(formatCPF(e.target.value));
                        }}
                        maxLength={14} // Length of XXX.XXX.XXX-XX
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço (Logradouro)</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                        <Input placeholder="Número da residência" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                        <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!form.formState.isValid || isSubmitting}
              >
                {isSubmitting ? "Criando..." : "Criar Usuário"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="flex flex-col items-center gap-4 pt-4 border-t">
            <div className="w-full text-center text-sm text-muted-foreground">
               Já tem uma conta?{' '}
                <Link href="/login" className="underline hover:text-primary">
                Faça login
                </Link>
            </div>
            {/* Added Return to Main Menu button */}
             <Button variant="outline" size="sm" className="w-full" asChild>
                 <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retornar ao Menu Principal
                 </Link>
             </Button>
         </CardFooter>
      </Card>
    </div>
  );
}

