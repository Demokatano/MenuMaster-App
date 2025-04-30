
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, ListOrdered, Eye, FileText, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import { useProductContext } from '@/context/product-context';
import { useAuth } from '@/context/auth-context';
import type { DailyReport, CompletedOrder } from '@/types';

// Helper to format date string
const formatDate = (isoDateString: string): string => {
    // Adding T00:00:00 ensures the date is parsed in the local timezone, preventing off-by-one day issues
    return new Date(isoDateString + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// Helper to get date string for filtering
const getISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};


export default function GeneralReportPage() {
  const { monthlyReports, completedOrders } = useProductContext();
  const { isAdminLoggedIn } = useAuth();
  const router = useRouter();

  const [selectedDayReport, setSelectedDayReport] = useState<DailyReport | null>(null);
  const [selectedDayOrders, setSelectedDayOrders] = useState<CompletedOrder[]>([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

   // --- Authentication Check ---
   useEffect(() => {
    if (!isAdminLoggedIn) {
      router.push('/admin');
    }
  }, [isAdminLoggedIn, router]);

   // Calculate overall total from monthly reports
   const overallTotal = useMemo(() => {
     return monthlyReports.reduce((sum, report) => sum + report.total, 0);
   }, [monthlyReports]);

   // Function to handle viewing details for a specific day
   const handleViewDayDetails = (report: DailyReport) => {
       setSelectedDayReport(report);

       // Filter completed orders for the selected day
       const dayOrders = completedOrders.filter(order =>
           getISODateString(new Date(order.timestamp)) === report.date
       );
       setSelectedDayOrders(dayOrders);
       setIsDetailsDialogOpen(true);
   };

   // Sort monthly reports by date descending (most recent first)
   const sortedMonthlyReports = useMemo(() => {
       return [...monthlyReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [monthlyReports]);

   // Return null or loading if not admin (or redirecting)
   if (!isAdminLoggedIn) {
       return null; // Or a loading spinner
   }


  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className='h-7 w-7'/>
            Relatório Geral
        </h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/report">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Relatório Diário
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className='h-5 w-5 text-primary'/>
            Histórico de Vendas Diárias
          </CardTitle>
          <CardDescription>Lista dos totais de vendas para cada dia finalizado.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMonthlyReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum dia finalizado foi registrado ainda.</p>
          ) : (
             <ScrollArea className="h-[60vh] pr-4"> {/* Adjust height */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Total Vendido</TableHead>
                      <TableHead className="text-center">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMonthlyReports.map((report) => (
                      <TableRow key={report.date}>
                        <TableCell>{formatDate(report.date)}</TableCell>
                        <TableCell className="text-right font-medium">R$ {report.total.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                           <Button variant="ghost" size="icon" onClick={() => handleViewDayDetails(report)}>
                              <Eye className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </ScrollArea>
          )}
        </CardContent>
         <CardFooter className="pt-4 border-t">
           <div className="w-full flex justify-end text-xl font-bold text-primary">
             Total Geral Acumulado: R$ {overallTotal.toFixed(2)}
           </div>
         </CardFooter>
      </Card>

       {/* Dialog for Day Details */}
      <AlertDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
         <AlertDialogContent className="max-w-2xl"> {/* Wider dialog */}
           <AlertDialogHeader>
             <AlertDialogTitle>
                 Detalhes do Dia - {selectedDayReport ? formatDate(selectedDayReport.date) : ""}
             </AlertDialogTitle>
             <AlertDialogDescription>
                 Lista de pedidos finalizados no dia selecionado.
             </AlertDialogDescription>
           </AlertDialogHeader>
             <ScrollArea className="max-h-[60vh] my-4 pr-6">
                {selectedDayOrders.length > 0 ? (
                     <ul className="space-y-6">
                        {selectedDayOrders.map((order) => (
                        <li key={order.id} className="border p-4 rounded-lg shadow-sm bg-card">
                            <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                Pedido #{order.id.substring(0, 6)}...
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            </div>
                            {/* Item list */}
                             <ul className="space-y-1 mb-3 text-xs pl-6">
                                {order.items.map((item) => (
                                    <li key={item.id + item.name} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span className='text-muted-foreground'>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                             <div className="flex justify-end font-semibold text-sm border-t pt-2 mt-2">
                                <span>Total Pedido: R$ {order.total.toFixed(2)}</span>
                             </div>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum pedido registrado para este dia.</p>
                )}

             </ScrollArea>

           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setIsDetailsDialogOpen(false)}>Fechar</AlertDialogCancel>
           </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
