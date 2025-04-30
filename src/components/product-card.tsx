
"use client";
import type { Product } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useProductContext } from "@/context/product-context";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addProductToOrder } = useProductContext();

  const handleAddClick = () => {
    addProductToOrder(product);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-primary">
          R$ {product.price.toFixed(2)}
        </span>
        <Button size="sm" onClick={handleAddClick} aria-label={`Adicionar ${product.name} ao pedido`}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
