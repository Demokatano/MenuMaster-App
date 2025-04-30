
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
import { useAuth } from "@/context/auth-context";
import { useStoreSettings } from "@/context/store-settings-context"; // Import new context
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, MapPin, Hash } from "lucide-react"; // Added icons

// Validation schema
const cepRegex = /^\d{5}-\d{3}$/; // Regex for 00000-000 format

const storeAddressSchema = z.object({
  address: z.string().min(5, "Endereço da loja é obrigatório"),
  cep: z.string().regex(cepRegex, "CEP inválido (formato: 00000-000)"),
  number: z.string().min(1, "Número do estabelecimento é obrigatório"),
});

type StoreAddressFormValues = z.infer<typeof storeAddressSchema>;

export default function StoreAddressPage() {
  const { isAdminLoggedIn } = useAuth();
  const { storeSettings, updateStoreSettings } = useStoreSettings(); // Use the settings context
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StoreAddressFormValues>({
    resolver: zodResolver(storeAddressSchema),
    defaultValues: {
      address: "",
      cep: "",
      number: "",
    },
  });

  // --- Authentication Check ---
  useEffect(() => {
    if (!isAdminLoggedIn) {
      router.push('/admin');
    }
  }, [isAdminLoggedIn, router]);

  // --- Populate Form with Current Settings ---
  useEffect(() => {
    if (storeSettings) {
      form.reset({
        address: storeSettings.address || "",
        cep: storeSettings.cep || "",
        number: storeSettings.number || "",
      });
    }
  }, [storeSettings, form]);

  // --- Handle Form Submission ---
  const onSubmit = (data: StoreAddressFormValues) => {
    setIsSubmitting(true);
    const success = updateStoreSettings(data); // Update settings via context

    if (success) {
      // Toast is handled within updateStoreSettings
    } else {
      // Error toast is handled within updateStoreSettings
    }
    setIsSubmitting(false);
  };

  // --- Prevent Rendering if Not Admin ---
  if (!isAdminLoggedIn) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-2">
             <MapPin className="h-7 w-7 text-primary" />
             Endereço da Loja
         </h1>
         <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Voltar ao Painel Admin
            </Link>
         </Button>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Informações do Endereço</CardTitle>
          <CardDescription>Atualize o endereço físico da loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da Loja (Logradouro)</FormLabel>
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
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do estabelecimento" {...field} />
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

              <CardFooter className="p-0 pt-6">
                <Button type="submit" disabled={isSubmitting}>
                   <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Salvar Endereço"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
