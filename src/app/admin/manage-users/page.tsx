
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useProductContext } from '@/context/product-context'; // To get order history
import type { User, CompletedOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import standard Dialog
import { Input } from '@/components/ui/input'; // For search/filter
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, Trash2, Edit, Eye, DollarSign, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper to format date and time
const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

export default function ManageUsersPage() {
  const { isAdminLoggedIn, users, updateUser, deleteUser } = useAuth(); // Add deleteUser later
  const { completedOrders } = useProductContext();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSpendingModalOpen, setIsSpendingModalOpen] = useState(false);
  const [userSpendingHistory, setUserSpendingHistory] = useState<CompletedOrder[]>([]);
  const [userTotalSpending, setUserTotalSpending] = useState(0);

  // --- Authentication Check ---
  useEffect(() => {
    if (!isAdminLoggedIn) {
      router.push('/admin');
    }
  }, [isAdminLoggedIn, router]);

  // --- Filter Users ---
  const filteredUsers = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    // Ensure users array is not empty and items are valid before filtering
    if (!users || users.length === 0) return [];

    return users.filter(user => {
        // Basic safety check for user object structure
        if (!user || typeof user !== 'object') return false;

        const nameMatch = user.name?.toLowerCase().includes(lowerSearchTerm);
        const emailMatch = user.email?.toLowerCase().includes(lowerSearchTerm);
        const loginMatch = user.login?.toLowerCase().includes(lowerSearchTerm);
        // Safely check if cpf exists and includes the search term
        const cpfMatch = user.cpf && typeof user.cpf === 'string' && user.cpf.includes(searchTerm);

        return nameMatch || emailMatch || loginMatch || cpfMatch;
    });
  }, [users, searchTerm]);


  // --- Action Handlers ---
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

   const handleViewSpending = (userId: string) => {
     // Ensure selectedUser is set before trying to access its ID
     const userToView = users.find(u => u.id === userId);
     if (!userToView) {
         toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
         return;
     }
     setSelectedUser(userToView); // Set the selected user for the modal title

     const history = completedOrders
       .filter(order => order.userId === userId)
       .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
     const total = history.reduce((sum, order) => sum + order.total, 0);

     setUserSpendingHistory(history);
     setUserTotalSpending(total);
     setIsSpendingModalOpen(true);
   };

  const handleEditUser = (userId: string) => {
    // Navigate to a dedicated edit page (implementation pending)
    // We need to pass the user ID to the edit page
    router.push(`/admin/manage-users/edit/${userId}`);
    // toast({ title: "Ação Pendente", description: "Funcionalidade de edição de usuário (admin) ainda não implementada.", variant: "default"});
    // console.warn("Admin user edit functionality not implemented yet.");
  };

   const handleDeleteUser = (userId: string) => {
        // Use the deleteUser function from context
        const success = deleteUser(userId);
        // Toasts are handled within the deleteUser function in the context
        if (!success) {
           // Optionally add a fallback toast here if context doesn't always handle it
           // toast({ title: "Erro", description: "Não foi possível excluir o usuário.", variant: "destructive" });
           console.warn("Admin user deletion function reported failure.");
        }
   };

  // --- Render Logic ---
  if (!isAdminLoggedIn) {
    return null; // Or loading indicator
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Gerenciar Usuários
        </h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Painel Admin
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Visualize, edite ou exclua usuários cadastrados.</CardDescription>
           <div className="pt-4">
             <Input
               placeholder="Buscar por nome, email, login ou CPF..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="max-w-sm"
             />
           </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca.' : (users.length === 0 ? 'Nenhum usuário cadastrado ainda.' : 'Nenhum usuário encontrado.')}
            </p>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.login}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="Visualizar" onClick={() => handleViewUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEditUser(user.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* Delete Button with Confirmation */}
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário "{user.name}" ({user.login})? Esta ação não pode ser desfeita e removerá todos os dados associados.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Excluir Usuário
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
         <CardFooter className="pt-4 border-t">
           <p className="text-sm text-muted-foreground">
             Exibindo {filteredUsers.length} de {users.length} usuário(s).
           </p>
         </CardFooter>
      </Card>

      {/* View User Details Dialog */}
       <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Detalhes do Usuário</DialogTitle>
             <DialogDescription>Informações cadastrais do usuário selecionado.</DialogDescription>
           </DialogHeader>
           {selectedUser && (
             <div className="space-y-3 py-4 text-sm">
                <p><strong>Nome:</strong> {selectedUser.name}</p>
                <p><strong>Login:</strong> {selectedUser.login}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>CPF:</strong> {selectedUser.cpf || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {selectedUser.phone || 'Não informado'}</p>
                <Separator />
                 <p><strong>Endereço:</strong> {selectedUser.address ? `${selectedUser.address}, Nº ${selectedUser.houseNumber}` : 'Não informado'}</p>
                <p><strong>CEP:</strong> {selectedUser.cep || 'Não informado'}</p>
             </div>
           )}
           <DialogFooter className="sm:justify-between gap-2 pt-4 border-t"> {/* Changed layout */}
               <Button
                 type="button"
                 variant="secondary"
                 onClick={() => selectedUser && handleViewSpending(selectedUser.id)}
                 disabled={!selectedUser}
               >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Visualizar Gastos
               </Button>
               <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                 Fechar
               </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

        {/* View User Spending History Dialog */}
        <Dialog open={isSpendingModalOpen} onOpenChange={setIsSpendingModalOpen}>
          <DialogContent className="max-w-2xl"> {/* Wider dialog */}
            <DialogHeader>
              <DialogTitle>Histórico de Gastos - {selectedUser?.name}</DialogTitle>
              <DialogDescription>Pedidos realizados por este usuário.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-6">
              {userSpendingHistory.length > 0 ? (
                <ul className="space-y-4">
                  {userSpendingHistory.map((order) => (
                    <li key={order.id} className="border p-3 rounded-lg shadow-sm bg-card">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-sm flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4 text-primary" />
                          Pedido #{order.id.substring(0, 6)}...
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(order.timestamp)}
                        </span>
                      </div>
                      <ul className="space-y-1 mb-2 text-xs pl-5">
                        {order.items.map((item) => (
                          <li key={item.id + item.name} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className='text-muted-foreground'>R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end font-semibold text-xs border-t pt-1 mt-1">
                        <span>Total Pedido: R$ {order.total.toFixed(2)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum pedido encontrado para este usuário.</p>
              )}
            </ScrollArea>
             <Separator className="my-4" />
             <div className="text-right font-bold text-lg text-primary">
                 Total Gasto: R$ {userTotalSpending.toFixed(2)}
             </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSpendingModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}

