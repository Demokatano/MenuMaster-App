
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from "@/types";
import { useProductContext } from "@/context/product-context"; // Import context

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // onConfirm is removed, logic handled internally now
  orderItems: (Product & { quantity: number })[];
  total: number;
}

export function OrderConfirmationDialog({
  isOpen,
  onClose,
  orderItems,
  total,
}: OrderConfirmationDialogProps) {
  const { clearOrder } = useProductContext(); // Get clearOrder (which finalizes)

  const handleConfirm = () => {
    clearOrder(); // Finalize the order using the context function
    onClose(); // Close the dialog after finalizing
    // Toast notification is handled within clearOrder
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, revise seu pedido antes de confirmar. Ao confirmar, o pedido será finalizado e registrado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-[300px] my-4 pr-6">
          <ul className="space-y-2">
            {orderItems.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="flex justify-between font-semibold text-base mt-4 pt-4 border-t">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Confirmar Compra
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

