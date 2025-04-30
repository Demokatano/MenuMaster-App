
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Lock, MapPin, Hash, User } from "lucide-react";
import type { UpdateUserData, User } from "@/types";
import { isValidCPF } from "@/lib/validation/cpf";

// Validation schema
const cepRegex = /^\d{5}-\d{3}$/;
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

// Updated schema to include optional password change fields
const adminEditUserSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
  cpf: z.string().regex(cpfRegex, "CPF inválido (formato: XXX.XXX.XXX-XX)")
    .refine(isValidCPF, "CPF inválido").optional(),
  address: z.string().min(5, "Endereço é obrigatório"),
  cep: z.string().regex(cepRegex, "CEP inválido (formato: 00000-000)"),
  houseNumber: z.string().min(1, "Número da residência é obrigatório"),
  phone: z.string().min(8, "Telefone inválido"),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  // If attempting to change password, validate length and match
  if (data.newPassword || data.confirmNewPassword) {
    if (!data.newPassword || data.newPassword.length < 6) return false;
    if (data.newPassword !== data.confirmNewPassword) return false;
  }
  return true;
}, {
  message: "Para redefinir a senha, preencha a nova senha (mínimo 6 caracteres) e a confirmação. As senhas devem ser iguais.",
  path: ["newPassword", "confirmNewPassword"], // Apply error to these fields if refinement fails
});


type AdminEditUserFormValues = z.infer<typeof adminEditUserSchema>;

export default function AdminEditUserPage() {
  const { isAdminLoggedIn, users, updateUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const userId = params.userId as string;

  const form = useForm<AdminEditUserFormValues>({
    resolver: zodResolver(adminEditUserSchema),
    defaultValues: {
      name: "",
      email: "",
      login: "",
      cpf: "",
      address: "",
      cep: "",
      houseNumber: "",
      phone: "",
      newPassword: "", // Initialize password fields
      confirmNewPassword: "",
    },
  });

  // --- Auth & User Fetching ---
  useEffect(() => {
    if (!isAdminLoggedIn) {
      router.push("/admin");
    }
  }, [isAdminLoggedIn, router]);

  useEffect(() => {
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setUserToEdit(user);
        form.reset({
          name: user.name || "",
          email: user.email || "",
          login: user.login || "",
          cpf: user.cpf || "",
          address: user.address || "",
          cep: user.cep || "",
          houseNumber: user.houseNumber || "",
          phone: user.phone || "",
          newPassword: "", // Ensure password fields are empty on load
          confirmNewPassword: "",
        });
      } else {
        toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
        router.push("/admin/manage-users");
      }
    }
  }, [userId, users, form, toast, router]);

  // --- Form Submission ---
  const onSubmit = (data: AdminEditUserFormValues) => {
    if (!userToEdit) return;

    setIsSubmitting(true);

    const updateData: UpdateUserData = {
      id: userToEdit.id,
      name: data.name,
      email: data.email,
      login: data.login, // Update login if it changes
      cpf: data.cpf,
      address: data.address,
      cep: data.cep,
      houseNumber: data.houseNumber,
      phone: data.phone,
    };

    // Add password only if provided and validated by schema
    if (data.newPassword) {
      updateData.newPassword = data.newPassword;
      updateData.isAdminPasswordReset = true; // Flag for context to bypass current password check
    }


    const success = updateUser(updateData);

    if (success) {
        // Reset password fields after successful submission
        form.reset({
            ...form.getValues(), // Keep other potentially changed fields
            newPassword: "",
            confirmNewPassword: "",
        });
        // Toast handled in context
    } else {
        // Error toast handled in context
    }
    setIsSubmitting(false);
  };

   // --- Prevent Rendering if Not Admin or User Not Found ---
   if (!isAdminLoggedIn) {
     return null;
   }
   if (!userToEdit && users.length > 0) {
        return <div className="container p-8 text-center text-destructive">Usuário não encontrado.</div>;
   }
   if (!userToEdit) {
      return <div className="container p-8 text-center text-muted-foreground">Carregando dados do usuário...</div>;
   }


  // Function to format CPF input
  const formatCPF = (value: string) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            Editar Usuário (Admin)
         </h1>
         <Button variant="outline" size="sm" asChild>
            <Link href="/admin/manage-users">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Voltar para Gerenciar Usuários
            </Link>
         </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informações de {userToEdit?.name}</CardTitle>
          <CardDescription>Atualize os dados cadastrais ou redefina a senha do usuário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               {/* Login Field (Admin can edit login now) */}
                <FormField
                    control={form.control}
                    name="login"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Login</FormLabel>
                        <FormControl>
                           <Input placeholder="Login do usuário" {...field} />
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
                      <Input placeholder="Nome do usuário" {...field} />
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
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
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
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Fields */}
              <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Endereço
                  </h3>
                   <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço para entrega</FormLabel>
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

              <Separator />

              {/* Password Reset Section */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium flex items-center gap-2">
                   <Lock className="h-5 w-5 text-primary" />
                   Redefinir Senha (Opcional)
                 </h3>
                  <p className="text-sm text-muted-foreground">Deixe em branco para não alterar a senha atual.</p>
                 <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                           <Input type="password" placeholder="Nova senha (mín. 6 caracteres)" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="confirmNewPassword"
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
               </div>

               {/* Display general refinement error for password mismatch */}
                {form.formState.errors.root?.message && (
                    <FormMessage>{form.formState.errors.root.message}</FormMessage>
                )}

              <CardFooter className="p-0 pt-6">
                <Button type="submit" disabled={isSubmitting}>
                   <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
