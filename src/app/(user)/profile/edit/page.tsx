
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Lock, MapPin, Hash, User, LogIn } from "lucide-react"; // Added LogIn icon
import type { UpdateUserData } from "@/types"; // Import the new type
import { isValidCPF } from "@/lib/validation/cpf"; // Import CPF validation helper

// Validation schema
const cepRegex = /^\d{5}-\d{3}$/; // Regex for 00000-000 format
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/; // Regex for XXX.XXX.XXX-XX format

// Use Zod's context feature for checking login uniqueness within the schema refinement
const editProfileSchema = z.object({
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"), // Added login
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().regex(cpfRegex, "CPF inválido (formato: XXX.XXX.XXX-XX)")
    .refine(isValidCPF, "CPF inválido").optional().or(z.literal('')), // Allow empty string for optional
  address: z.string().min(5, "Endereço é obrigatório"),
  cep: z.string().regex(cepRegex, "CEP inválido (formato: 00000-000)"),
  houseNumber: z.string().min(1, "Número da residência é obrigatório"),
  phone: z.string().min(8, "Telefone inválido"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  // Password change logic
  if (data.newPassword && (!data.currentPassword || !data.confirmNewPassword)) {
    return false;
  }
  if (data.newPassword && data.newPassword.length < 6) {
    return false;
  }
  if (data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "Para alterar a senha, preencha a senha atual, a nova senha (mínimo 6 caracteres) e a confirmação. As novas senhas devem ser iguais.",
  path: ["currentPassword", "newPassword", "confirmNewPassword"],
});

// Define the context type for Zod refinement
interface EditProfileSchemaContext {
    users: import('@/types').User[];
    currentUserId: string;
}


type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export default function EditProfilePage() {
  const { currentUser, updateUser, users } = useAuth(); // Get users list for uniqueness check
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditProfileFormValues>({
    // Pass context to zodResolver
    resolver: zodResolver(editProfileSchema, {
        context: { users: users || [], currentUserId: currentUser?.id || '' } // Pass users and current ID
    }),
    defaultValues: {
      login: "",
      name: "",
      email: "",
      cpf: "",
      address: "",
      cep: "",
      houseNumber: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
     // Revalidate on change for immediate feedback on uniqueness
     mode: "onChange",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    } else {
        // Populate form with current user data once available
         form.reset({
            login: currentUser.login || "", // Populate login
            name: currentUser.name || "",
            email: currentUser.email || "",
            cpf: currentUser.cpf || "",
            address: currentUser.address || "",
            cep: currentUser.cep || "",
            houseNumber: currentUser.houseNumber || "",
            phone: currentUser.phone || "",
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
         });
    }
  }, [currentUser, router, form]);

  // Add login uniqueness check directly in the schema if possible
   const refinedSchema = editProfileSchema.refine(
        (data) => {
            if (!currentUser) return true; // Skip if no user context yet
            // Check if login has changed and if the new login is taken by another user
            return data.login === currentUser.login || !users.some(u => u.login === data.login && u.id !== currentUser.id);
        },
        {
            message: "Este login já está em uso por outra conta.",
            path: ["login"], // Apply error to the login field
        }
    );

   // Re-create form instance with the refined schema when users or currentUser change
   useEffect(() => {
       form.reset(form.getValues(), {
           keepErrors: true, // Keep existing errors until revalidation
           keepDirty: true,
       });
   }, [users, currentUser, form]);


  const onSubmit = (data: EditProfileFormValues) => {
    if (!currentUser) return;

    setIsSubmitting(true);

     // Construct the update data object
     const updateData: UpdateUserData = {
        id: currentUser.id,
        login: data.login, // Include login
        name: data.name,
        email: data.email,
        cpf: data.cpf || undefined, // Send undefined if empty, keep existing otherwise
        address: data.address,
        cep: data.cep,
        houseNumber: data.houseNumber,
        phone: data.phone,
     };

     // Add password fields only if they are provided and validated
     if (data.newPassword && data.currentPassword) {
         updateData.currentPassword = data.currentPassword;
         updateData.newPassword = data.newPassword;
     }

    const success = updateUser(updateData); // updateUser needs to handle login update and uniqueness

    if (success) {
       // Reset password fields after successful submission
        form.reset({
            ...data, // Keep other fields (including the potentially new login)
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });
        // Toast is handled within updateUser
    }
    // On failure, toast is also handled within updateUser
    setIsSubmitting(false);
  };

   // Prevent rendering if redirecting or no user
    if (!currentUser) {
        return null; // Or a loading spinner
    }

  // Function to format CPF input
  const formatCPF = (value: string) => {
      const digits = value.replace(/\D/g, ''); // Remove non-digits
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };


  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
         <h1 className="text-3xl font-bold">Editar Perfil</h1>
         <Button variant="outline" size="sm" asChild>
            <Link href="/">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Voltar ao Menu
            </Link>
         </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Suas Informações</CardTitle>
          <CardDescription>Atualize seus dados cadastrais e de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Login Field */}
               <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                       <LogIn className="h-4 w-4" /> Login
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome de login" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Information Fields */}
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                       <User className="h-4 w-4" /> Nome Completo
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
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
                        value={field.value ?? ''} // Handle potential null/undefined from initial load
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
                 {/* Add fields for Complemento, Bairro, Cidade, Estado if needed */}
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

               {/* Password Change Section */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium flex items-center gap-2">
                   <Lock className="h-5 w-5 text-primary" />
                   Alterar Senha (Opcional)
                 </h3>
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="Sua senha atual" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="Sua nova senha (mínimo 6 caracteres)" {...field} />
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
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                 />
               </div>

               {/* Display general refinement error */}
               {form.formState.errors.root?.message && (
                 <FormMessage>{form.formState.errors.root.message}</FormMessage>
               )}
               {form.formState.errors.currentPassword?.message && <FormMessage>{form.formState.errors.currentPassword.message}</FormMessage>}
                {form.formState.errors.newPassword?.message && <FormMessage>{form.formState.errors.newPassword.message}</FormMessage>}
                {form.formState.errors.confirmNewPassword?.message && <FormMessage>{form.formState.errors.confirmNewPassword.message}</FormMessage>}


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

