
"use client";

import { ProductCard } from "@/components/product-card";
import { useProductContext } from "@/context/product-context";
import { Button } from "@/components/ui/button"; // Import Button

export function ProductList() {
  const { filteredProducts, categories, selectedCategory, setSelectedCategory } = useProductContext();

  // Define the specific categories required by the user
  const displayCategories = ["Todos", "Pizzas", "Hambúrguer", "Sucos e Milkshakes", "Saladas"];

  // Filter available categories to only include those requested and "Todos"
  const availableDisplayCategories = displayCategories.filter(cat => cat === "Todos" || categories.includes(cat));


  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Cardápio</h2>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableDisplayCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={`transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {category}
          </Button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
         <p className="text-muted-foreground text-center py-8">Nenhum produto encontrado nesta categoria ou com este termo de busca.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
