
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { ArrowLeft, ShoppingBag, CalendarCheck, CalendarDays, LineChart } from 'lucide-react'; // Added icons
import { useProductContext } from '@/context/product-context';
import { useAuth } from '@/context/auth-context';
import type { CompletedOrder, DailyReport } from '@/types';
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Helper function to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

export default function AdminReportPage() {
  const { completedOrders, monthlyReports, finalizeDay, isDayFinalized } = useProductContext();
  const { isAdminLoggedIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [dailyOrders, setDailyOrders] = useState<CompletedOrder[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [todayAlreadyFinalized, setTodayAlreadyFinalized] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // --- Authentication Check ---
  useEffect(() => {
    if (!isAdminLoggedIn) {
      router.push('/admin');
    }
  }, [isAdminLoggedIn, router]);

  // --- Filter Orders for Today & Check Finalization Status ---
  useEffect(() => {
    const today = new Date();
    const todayStr = getTodayString();

    // Filter orders for today
    const filtered = completedOrders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.toISOString().split('T')[0] === todayStr;
    });
    setDailyOrders(filtered);

    // Calculate total for daily orders
    const total = filtered.reduce((sum, order) => sum + order.total, 0);
    setDailyTotal(total);

    // Check if today is already finalized
    setTodayAlreadyFinalized(isDayFinalized(today));

  }, [completedOrders, isDayFinalized]);

  const handleFinalizeDay = () => {
    setIsFinalizing(true);
    const success = finalizeDay();
    if (success) {
      // Update finalized status locally immediately after success
      setTodayAlreadyFinalized(true);
      // Toast handled within context function
    } else {
      // Error toast handled within context function (e.g., already finalized)
    }
    setIsFinalizing(false);
  };

  // Calculate monthly total
  const monthlyTotal = monthlyReports.reduce((sum, report) => sum + report.total, 0);

  // Return null or loading if not admin (or redirecting)
  if (!isAdminLoggedIn) {
      return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
       <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Relatórios</h1>
         <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel Admin
              </Link>
            </Button>
              <Button variant="secondary" size="sm" asChild>
                 <Link href="/admin/general-report"> {/* Link to the new page */}
                    <LineChart className="mr-2 h-4 w-4" />
                    Relatório Geral
                 </Link>
              </Button>
         </div>
      </div>

      {/* Daily Report Card */}
      <Card>
        <CardHeader>
           <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                    <CardTitle className='flex items-center gap-2'>
                        <CalendarDays className='h-5 w-5 text-primary'/>
                        Vendas de Hoje ({new Date().toLocaleDateString()})
                    </CardTitle>
                    <CardDescription>Lista de todos os pedidos finalizados hoje.</CardDescription>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button
                            variant="destructive"
                            disabled={todayAlreadyFinalized || isFinalizing}
                            size="sm"
                        >
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            {isFinalizing ? "Finalizando..." : todayAlreadyFinalized ? "Dia Finalizado" : "Finalizar Dia"}
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Finalização do Dia</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja finalizar o dia de hoje ({new Date().toLocaleDateString()})? O total de vendas será registrado e não poderá ser alterado.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFinalizing}>Não</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleFinalizeDay}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isFinalizing}
                         >
                            {isFinalizing ? "Processando..." : "Sim, Finalizar"}
                         </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
           </div>
        </CardHeader>
        <CardContent>
          {dailyOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum pedido finalizado hoje ainda.</p>
          ) : (
            <ScrollArea className="h-[40vh] pr-4"> {/* Adjust height as needed */}
              <ul className="space-y-6">
                {dailyOrders.map((order) => (
                  <li key={order.id} className="border p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="font-semibold text-lg flex items-center gap-2">
                           <ShoppingBag className="h-5 w-5 text-primary" />
                           Pedido #{order.id.substring(0, 6)}... {/* Shorten ID */}
                       </h3>
                       <span className="text-sm text-muted-foreground">
                           {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Show time */}
                       </span>
                    </div>

                    <Separator className="my-2" />

                    <ul className="space-y-1 mb-3 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id + item.name} className="flex justify-between"> {/* Use combination for key */}
                          <span>{item.quantity}x {item.name}</span>
                          <span className='text-muted-foreground'>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>

                     <Separator className="my-2" />

                     <div className="flex justify-end font-semibold text-base">
                         <span>Total: R$ {order.total.toFixed(2)}</span>
                     </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
         <CardFooter className="pt-4 border-t">
           <div className="w-full flex justify-end text-xl font-bold text-primary">
                Total do Dia: R$ {dailyTotal.toFixed(2)}
           </div>
         </CardFooter>
      </Card>

       {/* Monthly Summary Card */}
       <Card>
         <CardHeader>
           <CardTitle className='flex items-center gap-2'>
              <LineChart className='h-5 w-5 text-primary'/>
              Resumo Mensal (Parcial)
           </CardTitle>
           <CardDescription>Total acumulado dos dias finalizados neste mês.</CardDescription>
         </CardHeader>
         <CardContent>
           {monthlyReports.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">Nenhum dia finalizado ainda.</p>
           ) : (
             <ScrollArea className="h-[30vh] pr-4"> {/* Adjust height */}
               <ul className="space-y-3">
                 {monthlyReports.map((report) => (
                   <li key={report.date} className="flex justify-between items-center border-b pb-2">
                     <span className='text-sm'>{new Date(report.date + 'T00:00:00').toLocaleDateString()}</span> {/* Ensure correct date parsing */}
                     <span className="font-medium">R$ {report.total.toFixed(2)}</span>
                   </li>
                 ))}
               </ul>
             </ScrollArea>
           )}
         </CardContent>
         <CardFooter className="pt-4 border-t">
           <div className="w-full flex justify-end text-xl font-bold text-primary">
             Total Mensal (Parcial): R$ {monthlyTotal.toFixed(2)}
           </div>
         </CardFooter>
       </Card>

    </div>
  );
}
