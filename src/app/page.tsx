
import type { Metadata } from "next";
import { ProductList } from "@/components/product-list";
import { OrderSummary } from "@/components/order-summary";
import { Header } from "@/components/header";
import { ProductProvider } from "@/context/product-context"; // Keep ProductProvider here for product logic

export const metadata: Metadata = {
  title: "MenuMaster",
  description: "Virtual menu application",
};


export default function Home() {
  return (
    <ProductProvider> {/* Product logic is specific to the main menu view */}
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col lg:flex-row container mx-auto p-4 gap-8">
          <div className="lg:w-2/3">
            <ProductList />
          </div>
          <aside className="lg:w-1/3 lg:sticky lg:top-20 h-fit">
            <OrderSummary />
          </aside>
        </main>
      </div>
    </ProductProvider>
  );
}

