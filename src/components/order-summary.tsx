
"use client";

import React from "react"; // Import React
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, MinusCircle, PlusCircle, ShoppingCart } from "lucide-react";
import { useProductContext } from "@/context/product-context";
import { OrderConfirmationDialog } from "./order-confirmation-dialog";
import type { Product } from "@/types";

export function OrderSummary() {
  const { order, removeProductFromOrder, updateProductQuantity } = useProductContext(); // Removed clearOrder (used in dialog)
  const [isConfirming, setIsConfirming] = React.useState(false);

  const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // handleConfirmOrder removed, logic moved to dialog

  const handleUpdateQuantity = (productId: string, change: number) => {
    updateProductQuantity(productId, change);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Resumo do Pedido
            </CardTitle>
        </CardHeader>
        <CardContent>
          {order.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Seu carrinho está vazio.</p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <ul className="space-y-4">
                {order.map((item: Product & { quantity: number }) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="w-4 text-center">{item.quantity}</span>
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeProductFromOrder(item.id)}
                      aria-label={`Remover ${item.name} do pedido`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
        {order.length > 0 && (
          <CardFooter className="flex flex-col items-stretch gap-4 pt-4">
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => setIsConfirming(true)}
              disabled={order.length === 0}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Finalizar Compra
            </Button>
          </CardFooter>
        )}
      </Card>

      <OrderConfirmationDialog
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        // onConfirm removed - handled internally now
        orderItems={order}
        total={total}
      />
    </>
  );
}

