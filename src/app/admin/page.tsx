
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useProductContext } from "@/context/product-context"; // Use the context
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Trash2, Edit, PlusCircle, Upload, XCircle, UserPlus, ArrowLeft, BarChart, MapPin, Users } from "lucide-react"; // Added ArrowLeft, BarChart, MapPin, Users
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

export default function AdminPage() {
  const { isAdminLoggedIn, loginAdmin, logoutAdmin } = useAuth();
  // Get product management functions and data from context
  const { products, categories: allCategories, addProduct, updateProduct, deleteProduct } = useProductContext();
  const router = useRouter();
  const { toast } = useToast();

  const [adminLogin, setAdminLogin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State for Add/Edit Product Form
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null); // Keep track of the product being edited
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
   const [productCategory, setProductCategory] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Filter out "Todos" category for the dropdown selection
  // Use available categories from context, excluding "Todos"
  const availableCategories = allCategories.filter(cat => cat !== "Todos");

  // Redirect if not admin logged in (client-side check)
  useEffect(() => {
    if (!isAdminLoggedIn) {
      // Check if accessed directly without password dialog
      // If direct access is attempted without being logged in, redirect to home.
      // The password dialog handles the initial login flow.
      // router.push('/'); // Can be enabled if direct access blocking is needed
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminLoggedIn]);


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = loginAdmin(adminLogin, adminPassword);
    if (!success) {
      // Error toast handled in loginAdmin
      setIsLoggingIn(false);
    }
    // No need to reset state on success as component will re-render
  };

  const handleAddProductClick = () => {
    setIsEditing(true);
    setCurrentProduct(null); // Clear current product for adding
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory(""); // Reset category
    setProductImageFile(null);
    setProductImagePreview(null);
    window.scrollTo(0, 0); // Scroll to top when adding a new product
  };

  const handleEditProductClick = (product: Product) => {
    window.scrollTo(0, 0); // Scroll to top when editing
    setIsEditing(true);
    setCurrentProduct(product);
    setProductName(product.name);
    setProductDescription(product.description);
    setProductPrice(product.price.toString());
    setProductCategory(product.category); // Set category for editing
    setProductImageFile(null); // Reset file input
    setProductImagePreview(product.imageUrl); // Show existing image
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    // Reset form fields on cancel
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory("");
    setProductImageFile(null);
    setProductImagePreview(null);
     // Clear the file input visually
     const fileInput = document.getElementById('product-image') as HTMLInputElement | null;
     if (fileInput) {
         fileInput.value = "";
     }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB.",
          variant: "destructive",
        });
        setProductImageFile(null);
        setProductImagePreview(currentProduct?.imageUrl || null); // Revert preview
         event.target.value = ""; // Clear file input
      } else {
        setProductImageFile(file);
        // Use FileReader to get a stable preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
             setProductImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

   const handleRemoveImage = () => {
    setProductImageFile(null);
    setProductImagePreview(null); // Clear preview
    // Also clear the file input visually if possible
    const fileInput = document.getElementById('product-image') as HTMLInputElement | null;
    if (fileInput) {
        fileInput.value = "";
    }
   };

  const handleProductSubmit = (e?: React.FormEvent) => { // Make event optional
    e?.preventDefault(); // Prevent default if called from a form submit event
    setIsSubmittingProduct(true);
    console.log("[AdminPage] Starting product submission..."); // Debug log

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Erro", description: "Preço inválido.", variant: "destructive" });
      setIsSubmittingProduct(false);
      console.log("[AdminPage] Invalid price."); // Debug log
      return;
    }

     if (!productCategory) {
      toast({ title: "Erro", description: "Selecione uma categoria.", variant: "destructive" });
      setIsSubmittingProduct(false);
      console.log("[AdminPage] Category not selected."); // Debug log
      return;
    }

    // Decide the final image URL
    let finalImageUrl = currentProduct?.imageUrl || `https://picsum.photos/seed/placeholder-${Date.now()}/400/300`;

    // Prioritize new file, then existing image, then placeholder for add/removed
    if (productImageFile && productImagePreview) { // New file uploaded
        finalImageUrl = productImagePreview;
         console.log("[AdminPage] Using new image preview URL:", finalImageUrl); // Debug log
    } else if (currentProduct && !productImageFile && productImagePreview) { // Editing, no new file, kept existing image
        finalImageUrl = productImagePreview;
         console.log("[AdminPage] Using existing image preview URL:", finalImageUrl); // Debug log
    } else if (currentProduct && !productImageFile && !productImagePreview) { // Editing and image removed
        finalImageUrl = `https://picsum.photos/seed/placeholder-removed-${Date.now()}/400/300`;
        console.log("[AdminPage] Using placeholder for removed image:", finalImageUrl); // Debug log
    } else if (!currentProduct && !productImageFile && !productImagePreview) { // Adding and no image selected
        finalImageUrl = `https://picsum.photos/seed/${productName.replace(/\s+/g, '-')}-${Date.now()}/400/300`;
        console.log("[AdminPage] Using placeholder for new item without image:", finalImageUrl); // Debug log
    }


     // Create product data object
     const productData: Omit<Product, 'id'> & { id?: string } = { // Allow optional ID
         name: productName,
         description: productDescription,
         price: price,
         category: productCategory,
         imageUrl: finalImageUrl, // Use the determined URL
     };


    // --- Call Context Function ---
    let operationSuccess = false;
    if (currentProduct) {
      // Update existing product using context function
      console.log("[AdminPage] Calling updateProduct with:", { ...currentProduct, ...productData });
      operationSuccess = updateProduct({ ...currentProduct, ...productData }); // Pass the full product object with ID
       console.log("[AdminPage] updateProduct returned:", operationSuccess); // Debug log
    } else {
      // Add new product using context function
      const newId = `prod_${Date.now()}_${Math.random().toString(16).slice(2)}`; // More robust mock ID
       console.log("[AdminPage] Calling addProduct with:", { ...productData, id: newId });
      operationSuccess = addProduct({ ...productData, id: newId }); // Add ID before passing to context
      console.log("[AdminPage] addProduct returned:", operationSuccess); // Debug log
    }

    // --- Handle Result ---
     if (operationSuccess) {
        console.log("[AdminPage] Product operation successful. Resetting form.");
        handleCancelEdit(); // Reset form state and clear inputs
        // Toast messages are handled within the context functions (called via setProducts)
     } else {
        console.warn("[AdminPage] Product operation failed (likely duplicate ID or not found). Form remains open.");
        // If add/update failed, toast is handled in context, keep form open.
     }

      setIsSubmittingProduct(false);
      console.log("[AdminPage] Finished product submission process."); // Debug log
  };

  // Use context delete function
  const handleDeleteProduct = (productId: string) => {
     console.log("[AdminPage] Calling deleteProduct for ID:", productId); // Debug log
     try {
        const success = deleteProduct(productId); // Call context delete function
         console.log("[AdminPage] deleteProduct returned:", success); // Debug log
        // Toast message handled by context function if successful (via setProducts)
        if (!success) {
            // Handle potential failure case not caught by context's toast (though it should)
            console.warn("[AdminPage] deleteProduct indicated failure but might not have toasted.");
        }
     } catch (error) {
         // Context function should ideally handle errors, catch here as fallback
         console.error("[AdminPage] Error calling deleteProduct:", error);
         toast({ title: "Erro Inesperado", description: "Falha ao excluir o produto.", variant: "destructive" });
     }
  };


  // If not logged in, show login form (remains the same)
  if (!isAdminLoggedIn) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
         <Card className="w-full max-w-sm">
           <CardHeader>
             <CardTitle>Login de Administrador</CardTitle>
             <CardDescription>Entre com suas credenciais de administrador.</CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleAdminLogin} className="space-y-4">
               <div>
                 <Label htmlFor="admin-login">Login</Label>
                 <Input
                   id="admin-login"
                   type="text"
                   value={adminLogin}
                   onChange={(e) => setAdminLogin(e.target.value)}
                   required
                   placeholder="Login de admin"
                 />
               </div>
               <div>
                 <Label htmlFor="admin-password-login">Senha</Label>
                 <Input
                   id="admin-password-login"
                   type="password"
                   value={adminPassword}
                   onChange={(e) => setAdminPassword(e.target.value)}
                   required
                   placeholder="Senha de admin"
                 />
               </div>
               <Button type="submit" className="w-full" disabled={isLoggingIn}>
                 {isLoggingIn ? "Entrando..." : "Entrar como Admin"}
               </Button>
             </form>
           </CardContent>
             <CardFooter className="flex-col items-center space-y-2 border-t pt-4 mt-4">
                 {/* Return to Home Button */}
                 <Button variant="outline" size="sm" className="w-full" asChild>
                     <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retornar à Tela Inicial
                     </Link>
                 </Button>
                 {/* Button to create a new admin account */}
                 <Button variant="outline" size="sm" className="w-full" asChild>
                     <Link href="/admin/signup">
                         <UserPlus className="mr-2 h-4 w-4"/>
                         Criar Nova Conta de Administrador
                     </Link>
                 </Button>
             </CardFooter>
         </Card>
       </div>
    );
  }

  // If logged in, show admin panel
  return (
    <div className="container mx-auto p-4 lg:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold">Painel do Administrador</h1>
             <div className="flex gap-2 flex-wrap">
                 {/* Gerenciar Usuários Button */}
                  <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/manage-users">
                         <Users className="mr-2 h-4 w-4" />
                         Gerenciar Usuários
                      </Link>
                  </Button>
                 {/* Store Address Button */}
                 <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/store-address">
                        <MapPin className="mr-2 h-4 w-4" />
                        Endereço da loja
                     </Link>
                 </Button>
                {/* Report Button */}
                 <Button variant="outline" size="sm" asChild>
                     <Link href="/admin/report">
                        <BarChart className="mr-2 h-4 w-4" />
                        Relatório
                     </Link>
                 </Button>
                 {/* Back to Home Button */}
                 <Button variant="outline" size="sm" asChild>
                     <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar à Tela Inicial
                     </Link>
                 </Button>
                 {/* Logout Button */}
                <Button variant="outline" onClick={logoutAdmin}>Sair</Button>
             </div>
        </div>

        {/* Add/Edit Product Form */}
        {isEditing ? (
             <Card className="mb-8">
                 <CardHeader>
                     <CardTitle>{currentProduct ? "Editar Produto" : "Adicionar Novo Produto"}</CardTitle>
                 </CardHeader>
                 <form
                   onSubmit={(e) => {
                     e.preventDefault(); // Prevent direct form submission
                     // The actual submission logic is triggered by the AlertDialog Action button
                   }}
                 >
                     <CardContent className="space-y-4">
                         {/* Name Input */}
                         <div>
                             <Label htmlFor="product-name">Nome do Produto</Label>
                             <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                         </div>
                          {/* Description Textarea */}
                         <div>
                             <Label htmlFor="product-description">Descrição</Label>
                             <Textarea id="product-description" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} required />
                         </div>
                         {/* Category Select */}
                          <div>
                             <Label htmlFor="product-category">Categoria</Label>
                             <Select
                                value={productCategory}
                                onValueChange={setProductCategory}
                             >
                                <SelectTrigger id="product-category">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.length > 0 ? (
                                        availableCategories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="placeholder" disabled>Nenhuma categoria disponível</SelectItem>
                                    )
                                    }
                                </SelectContent>
                             </Select>
                              {!productCategory && isSubmittingProduct && <p className="text-sm text-destructive mt-1">Selecione uma categoria.</p>}
                         </div>
                          {/* Price Input */}
                         <div>
                             <Label htmlFor="product-price">Preço (R$)</Label>
                             <Input id="product-price" type="number" step="0.01" min="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
                         </div>
                         {/* Image Input and Preview */}
                         <div>
                             <Label htmlFor="product-image">Imagem (até 2MB)</Label>
                             <div className="flex items-center gap-4">
                                 <Input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="flex-grow" />
                                 {productImagePreview && (
                                     <div className="relative h-20 w-20">
                                         <Image src={productImagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded" />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                            onClick={handleRemoveImage}
                                            aria-label="Remover imagem"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                     </div>
                                 )}
                                 {!productImagePreview && <Upload className="h-10 w-10 text-muted-foreground"/>}
                             </div>
                         </div>
                     </CardContent>
                     {/* Footer with Cancel/Publish buttons */}
                      <CardFooter className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button
                                    type="button"
                                    disabled={isSubmittingProduct || !productName || !productDescription || !productCategory || !productPrice }
                                 >
                                    {currentProduct ? "Atualizar" : "Publicar"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar {currentProduct ? "Atualização" : "Publicação"}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deseja {currentProduct ? "atualizar este item" : "incluir este novo item"} no cardápio?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isSubmittingProduct}>Não</AlertDialogCancel>
                                   <AlertDialogAction
                                     onClick={() => handleProductSubmit()}
                                     className="bg-primary hover:bg-primary/90"
                                     disabled={isSubmittingProduct}
                                    >
                                     {isSubmittingProduct ? (currentProduct ? "Atualizando..." : "Publicando...") : "Sim"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                     </CardFooter>
                 </form>
             </Card>
        ) : (
             <div className="mb-8 text-right">
                <Button onClick={handleAddProductClick} >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
                </Button>
             </div>
        )}


        {/* Product List - Renders products from context */}
         <h2 className="text-2xl font-semibold mb-4">Gerenciar Cardápio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Use 'products' directly from context */}
            {products.map(product => (
                <Card key={product.id} className="flex flex-col">
                    <CardHeader className="p-0 relative aspect-video">
                         <Image
                            src={product.imageUrl || `https://picsum.photos/seed/placeholder-item-${product.id}/400/300`}
                            alt={product.name}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-t-lg"
                            onError={(e) => {
                                console.warn(`Failed to load image for ${product.name}: ${product.imageUrl}`);
                                e.currentTarget.src = `https://picsum.photos/seed/fallback-${product.id}/400/300`;
                            }}
                            />
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                         <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                        <p className="font-semibold text-primary">R$ {product.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProductClick(product)}>
                            <Edit className="mr-1 h-4 w-4" /> Editar
                        </Button>
                         <AlertDialog>
                             <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                                </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">
                                    Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                             </AlertDialogContent>
                        </AlertDialog>

                    </CardFooter>
                </Card>
            ))}
        </div>
          {products.length === 0 && !isEditing && (
             <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado ainda.</p>
          )}

    </div>
  );
}

