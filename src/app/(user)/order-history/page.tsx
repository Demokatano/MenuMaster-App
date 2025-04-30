
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useProductContext } from '@/context/product-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, History, ShoppingBag, PackageOpen } from 'lucide-react'; // Added icons
import type { CompletedOrder } from '@/types';

// Helper to format date and time
const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrderHistoryPage() {
    const { currentUser } = useAuth();
    const { completedOrders } = useProductContext();
    const router = useRouter();
    const [userOrders, setUserOrders] = useState<CompletedOrder[]>([]);

    // Redirect if not logged in
    useEffect(() => {
        if (!currentUser) {
            router.push('/login'); // Redirect to login if no user
        }
    }, [currentUser, router]);

    // Filter orders for the current user and sort by date descending
    useEffect(() => {
        if (currentUser && completedOrders) {
            const filtered = completedOrders
                .filter(order => order.userId === currentUser.id)
                .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
            setUserOrders(filtered);
        } else {
            setUserOrders([]); // Clear if no user or no orders
        }
    }, [currentUser, completedOrders]);

    // Prevent rendering if redirecting or no user
    if (!currentUser) {
        return null; // Or a loading spinner
    }

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <History className="h-7 w-7 text-primary" />
                    Seu Histórico de Pedidos
                </h1>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Cardápio
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pedidos Realizados</CardTitle>
                    <CardDescription>Veja os detalhes dos seus pedidos anteriores.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <PackageOpen className="mx-auto h-12 w-12 mb-4" />
                            <p>Você ainda não fez nenhum pedido.</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[65vh] pr-4">
                             <div className="space-y-6">
                                {userOrders.map((order) => (
                                <Card key={order.id} className="shadow-sm">
                                    <CardHeader className="flex flex-row justify-between items-center pb-3">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <ShoppingBag className="h-5 w-5 text-primary" />
                                                Pedido #{order.id.substring(0, 6)}...
                                            </CardTitle>
                                             <CardDescription className="text-xs mt-1">
                                                {formatDateTime(order.timestamp)}
                                             </CardDescription>
                                        </div>
                                         <div className="font-semibold text-base text-primary">
                                            Total: R$ {order.total.toFixed(2)}
                                         </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Separator className="mb-3" />
                                         <ul className="space-y-1 text-sm">
                                             {order.items.map((item) => (
                                                <li key={item.id + item.name} className="flex justify-between">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span className="text-muted-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
                 {userOrders.length > 0 && (
                    <CardFooter className="pt-4 border-t">
                       <p className="text-sm text-muted-foreground">
                            Exibindo {userOrders.length} pedido(s).
                       </p>
                    </CardFooter>
                 )}
            </Card>
        </div>
    );
}
