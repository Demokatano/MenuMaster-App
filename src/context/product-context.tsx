
"use client";

import type { Product, CompletedOrder, CompletedOrderItem, DailyReport } from "@/types"; // Import order and report types
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { useStoreSettings } from "@/context/store-settings-context"; // Import store settings context

// Mock data for products with categories - This represents the initial state or data fetched from a source
const mockInitialProducts: Product[] = [
  { id: "1", name: "Hambúrguer Clássico", description: "Pão, carne, queijo, alface, tomate.", price: 25.50, imageUrl: "https://picsum.photos/seed/burger/400/300", category: "Hambúrguer" },
  { id: "2", name: "Pizza Margherita", description: "Molho de tomate, mussarela, manjericão.", price: 42.00, imageUrl: "https://picsum.photos/seed/pizza/400/300", category: "Pizzas" },
  { id: "3", name: "Salada Caesar", description: "Alface romana, croutons, parmesão, molho caesar.", price: 18.75, imageUrl: "https://picsum.photos/seed/salad/400/300", category: "Saladas" },
  { id: "4", name: "Batata Frita", description: "Porção generosa de batatas fritas crocantes.", price: 12.00, imageUrl: "https://picsum.photos/seed/fries/400/300", category: "Acompanhamentos" }, // Added a category
  { id: "5", name: "Refrigerante Lata", description: "Coca-Cola, Guaraná ou Fanta.", price: 6.00, imageUrl: "https://picsum.photos/seed/soda/400/300", category: "Sucos e Milkshakes" }, // Grouped drinks
  { id: "6", name: "Suco Natural Laranja", description: "Feito na hora com laranjas frescas.", price: 9.50, imageUrl: "https://picsum.photos/seed/juice/400/300", category: "Sucos e Milkshakes" }, // Grouped drinks
  { id: "7", name: "Cheeseburger Duplo", description: "Pão, duas carnes, dobro de queijo.", price: 32.00, imageUrl: "https://picsum.photos/seed/cheeseburger/400/300", category: "Hambúrguer" },
  { id: "8", name: "Milkshake Chocolate", description: "Cremoso milkshake de chocolate.", price: 15.00, imageUrl: "https://picsum.photos/seed/milkshake/400/300", category: "Sucos e Milkshakes" }, // Grouped drinks
  { id: "9", name: "Pizza Pepperoni", description: "Molho de tomate, mussarela, pepperoni.", price: 45.00, imageUrl: "https://picsum.photos/seed/pepperoni/400/300", category: "Pizzas" },
  { id: "10", name: "Salada Grega", description: "Pepino, tomate, cebola roxa, azeitonas, queijo feta.", price: 22.00, imageUrl: "https://picsum.photos/seed/greeksalad/400/300", category: "Saladas" },
];

// LocalStorage Keys
const LS_PRODUCTS_KEY = "menuMasterProducts";
const LS_COMPLETED_ORDERS_KEY = "menuMasterCompletedOrders";
const LS_MONTHLY_REPORTS_KEY = "menuMasterMonthlyReports"; // Key for historical daily totals


// Generic localStorage getter
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    // console.log(`[LocalStorage] Not in browser, returning default for key: ${key}.`); // Reduce noise
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // console.log(`[LocalStorage] Raw item retrieved for key ${key}:`, item ? item.substring(0, 100) + '...' : 'null'); // Reduce noise
    const parsed = item ? JSON.parse(item) : defaultValue;
    // console.log(`[LocalStorage] Parsed item for key ${key}:`, parsed); // Reduce noise
    // Basic validation if it's an array (optional, depends on expected type)
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`[LocalStorage] Expected array for key ${key} but got ${typeof parsed}. Returning default.`);
        setInLocalStorage(key, defaultValue); // Reset invalid data
        return defaultValue;
    }
     // Simple validation for products array
     if (key === LS_PRODUCTS_KEY && Array.isArray(parsed)) {
        const isValid = parsed.every(p => typeof p === 'object' && p !== null && 'id' in p && 'name' in p && 'price' in p);
        if (!isValid && parsed.length > 0) {
             console.warn("[LocalStorage] Stored products data is not valid. Returning default.");
             setInLocalStorage(key, defaultValue); // Reset
             return defaultValue;
        }
     }
      // Simple validation for completed orders array
      if (key === LS_COMPLETED_ORDERS_KEY && Array.isArray(parsed)) {
         const isValid = parsed.every(o => typeof o === 'object' && o !== null && 'id' in o && 'timestamp' in o && 'items' in o && 'total' in o);
         if (!isValid && parsed.length > 0) {
              console.warn("[LocalStorage] Stored completed orders data is not valid. Returning default.");
              setInLocalStorage(key, defaultValue); // Reset
              return defaultValue;
         }
      }
       // Simple validation for monthly reports array
       if (key === LS_MONTHLY_REPORTS_KEY && Array.isArray(parsed)) {
         const isValid = parsed.every(r => typeof r === 'object' && r !== null && 'date' in r && 'total' in r);
         if (!isValid && parsed.length > 0) {
              console.warn("[LocalStorage] Stored monthly reports data is not valid. Returning default.");
              setInLocalStorage(key, defaultValue); // Reset
              return defaultValue;
         }
       }


    return parsed;
  } catch (error) {
    console.error(`[LocalStorage] Error reading key “${key}”:`, error);
    // console.log(`[LocalStorage] Error occurred for key ${key}, returning default.`); // Reduce noise
    setInLocalStorage(key, defaultValue); // Attempt to reset corrupted data
    return defaultValue;
  }
};

// Generic localStorage setter
const setInLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    // console.warn(`[LocalStorage] Tried setting key “${key}” outside browser environment.`); // Reduce noise
    return;
  }
  try {
    // console.log(`[LocalStorage] Attempting to save to key ${key}.`); // Reduce noise
    window.localStorage.setItem(key, JSON.stringify(value));
    // console.log(`[LocalStorage] Data successfully saved for key ${key}.`); // Reduce noise
  } catch (error) {
    console.error(`[LocalStorage] Error setting key “${key}”:`, error);
  }
};


type OrderItem = Product & { quantity: number };

interface ProductContextType {
  products: Product[]; // All available products
  categories: string[]; // All available categories including "Todos"
  order: OrderItem[]; // Current active order
  completedOrders: CompletedOrder[]; // List of orders for the report
  monthlyReports: DailyReport[]; // Historical daily totals
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  filteredProducts: Product[]; // Products filtered by search and category
  addProductToOrder: (product: Product) => void;
  removeProductFromOrder: (productId: string) => void;
  updateProductQuantity: (productId: string, change: number) => void;
  clearOrder: () => void; // This will now finalize the order
  finalizeDay: () => boolean; // Finalizes today's total into monthly report
  isDayFinalized: (date: Date) => boolean; // Check if a specific day is already finalized
  // --- Product Management Functions (for Admin) ---
  addProduct: (newProduct: Product) => boolean; // Returns success status
  updateProduct: (updatedProduct: Product) => boolean; // Returns success status
  deleteProduct: (productId: string) => boolean; // Return success status
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<DailyReport[]>([]); // State for monthly reports
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from AuthContext
  const { storeSettings } = useStoreSettings(); // Get store settings

  // Load initial state from localStorage on mount
  useEffect(() => {
      // console.log("[ProductContext] Initializing state from localStorage..."); // Reduce noise
      const storedProducts = getFromLocalStorage<Product[]>(LS_PRODUCTS_KEY, mockInitialProducts);
      const storedCompletedOrders = getFromLocalStorage<CompletedOrder[]>(LS_COMPLETED_ORDERS_KEY, []);
      const storedMonthlyReports = getFromLocalStorage<DailyReport[]>(LS_MONTHLY_REPORTS_KEY, []); // Load monthly reports

      // console.log("[ProductContext] Products loaded:", storedProducts.length); // Reduce noise
      // console.log("[ProductContext] Completed Orders loaded:", storedCompletedOrders.length); // Reduce noise
      // console.log("[ProductContext] Monthly Reports loaded:", storedMonthlyReports.length); // Reduce noise

      setProducts(storedProducts);
      setCompletedOrders(storedCompletedOrders);
      setMonthlyReports(storedMonthlyReports); // Set monthly reports state
      setIsInitialized(true);
      // console.log("[ProductContext] Initialization complete."); // Reduce noise
  }, []); // Runs once on mount

   // Persist products to localStorage
   useEffect(() => {
     if (isInitialized) {
      //  console.log(`[ProductContext] Products state changed. Saving ${products.length} products.`); // Reduce noise
       setInLocalStorage<Product[]>(LS_PRODUCTS_KEY, products);
     }
   }, [products, isInitialized]);

   // Persist completed orders to localStorage
   useEffect(() => {
        if (isInitialized) {
            // console.log(`[ProductContext] Completed orders state changed. Saving ${completedOrders.length} orders.`); // Reduce noise
            setInLocalStorage<CompletedOrder[]>(LS_COMPLETED_ORDERS_KEY, completedOrders);
        }
   }, [completedOrders, isInitialized]);

    // Persist monthly reports to localStorage
    useEffect(() => {
         if (isInitialized) {
             // console.log(`[ProductContext] Monthly reports state changed. Saving ${monthlyReports.length} reports.`); // Reduce noise
             setInLocalStorage<DailyReport[]>(LS_MONTHLY_REPORTS_KEY, monthlyReports);
         }
    }, [monthlyReports, isInitialized]);


  // Recalculate categories whenever products change
  const categories = useMemo(() => {
    //  console.log("[ProductContext] Recalculating categories..."); // Reduce noise
     const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
     const sortedCategories = ["Todos", ...uniqueCategories.sort()];
    //  console.log("[ProductContext] Calculated categories:", sortedCategories); // Reduce noise
     return sortedCategories;
  }, [products]);


  const filteredProducts = useMemo(() => {
    // console.log(`[ProductContext] Filtering products. Search: '${searchTerm}', Category: '${selectedCategory}'`); // Reduce noise
    return products.filter((product) => {
      const nameLower = product.name?.toLowerCase() ?? '';
      const descLower = product.description?.toLowerCase() ?? '';
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || nameLower.includes(searchLower) || descLower.includes(searchLower);
      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // --- Order Management ---
  const addProductToOrder = useCallback((product: Product) => {
    let toastTitle = "";
    let toastDescription = "";
    setOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.id === product.id);
      let newOrder;
      if (existingItemIndex > -1) {
        newOrder = [...prevOrder];
        newOrder[existingItemIndex] = { ...newOrder[existingItemIndex], quantity: newOrder[existingItemIndex].quantity + 1 };
        toastTitle = "Item atualizado!";
        toastDescription = `${product.name} quantidade aumentada.`;
      } else {
        newOrder = [...prevOrder, { ...product, quantity: 1 }];
        toastTitle = "Item adicionado!";
        toastDescription = `${product.name} adicionado ao carrinho.`;
      }
      //  console.log("[ProductContext] Order state after adding/updating:", newOrder); // Reduce noise
      return newOrder;
    });
    setTimeout(() => toast({ title: toastTitle, description: toastDescription }), 0);
  }, [toast]);

  const removeProductFromOrder = useCallback((productId: string) => {
     let removedItemName = "";
     setOrder((prevOrder) => {
       const itemToRemove = prevOrder.find(item => item.id === productId);
       if (itemToRemove) {
           removedItemName = itemToRemove.name;
            const newOrder = prevOrder.filter((item) => item.id !== productId); // New array
            //  console.log("[ProductContext] Order state after removing:", newOrder); // Reduce noise
            return newOrder;
       }
        // console.log("[ProductContext] Item not found for removal, order unchanged."); // Reduce noise
       return prevOrder; // Same array if not found
     });
      if (removedItemName) {
          setTimeout(() => toast({ title: "Item removido", description: `${removedItemName} removido.`, variant: "destructive" }), 0);
      }
  }, [toast]);

   const updateProductQuantity = useCallback((productId: string, change: number) => {
    let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;
    setOrder((prevOrder) => {
        const itemIndex = prevOrder.findIndex(item => item.id === productId);
        if (itemIndex === -1) return prevOrder;

        const item = prevOrder[itemIndex];
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            toastInfo = { title: "Item removido", description: `${item.name} removido.`, variant: "destructive" };
            const newOrder = prevOrder.filter(i => i.id !== productId); // New array
            // console.log("[ProductContext] Order state after removing (quantity <= 0):", newOrder); // Reduce noise
            return newOrder;
        } else {
            toastInfo = { title: "Quantidade atualizada", description: `Quantidade de ${item.name} atualizada para ${newQuantity}.` };
            const newOrder = [...prevOrder]; // New array
            newOrder[itemIndex] = { ...item, quantity: newQuantity };
            // console.log("[ProductContext] Order state after updating quantity:", newOrder); // Reduce noise
            return newOrder;
        }
    });
     if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
  }, [toast]);


  // --- Finalize Order (adds to completedOrders) ---
  const clearOrder = useCallback(() => {
     if (order.length === 0) {
        // console.log("[ProductContext] No items in order to finalize."); // Reduce noise
        return; // Don't create an empty completed order
     }
    //  console.log("[ProductContext] Finalizing order..."); // Reduce noise

     const orderTotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

     // Create the completed order object
     const finalizedOrder: CompletedOrder = {
        id: `order_${Date.now()}_${Math.random().toString(16).slice(2)}`, // Unique ID
        timestamp: Date.now(),
        items: order.map(item => ({ // Map to CompletedOrderItem format
            id: item.id,
            name: item.name,
            price: item.price, // Capture price at time of order
            quantity: item.quantity,
        })),
        total: orderTotal,
        userId: currentUser?.id, // Add the current user's ID
     };
    //  console.log("[ProductContext] Finalized order object:", finalizedOrder); // Reduce noise

     // Add the finalized order to the completed orders list
     setCompletedOrders(prevCompleted => {
         const newCompleted = [...prevCompleted, finalizedOrder];
        //  console.log("[ProductContext] Completed orders state after adding finalized order:", newCompleted); // Reduce noise
         return newCompleted;
     }); // New array reference

     // --- Simulate sending email ---
     if (currentUser && currentUser.email) {
         const storeName = "MenuMaster"; // Or fetch from storeSettings if available
         const emailSubject = `Confirmação do seu pedido na ${storeName} (#${finalizedOrder.id.substring(0, 6)})`;
         const emailBody = `
            Olá ${currentUser.name},

            Obrigado pelo seu pedido!

            Detalhes do Pedido:
            ${finalizedOrder.items.map(item => `- ${item.quantity}x ${item.name}: R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

            Total: R$ ${finalizedOrder.total.toFixed(2)}

            Agradecemos a sua preferência!
            ${storeName}
         `;

         // In a real app, you would use an email service here.
         // For this mock, we just log it to the console.
         console.log("--- SIMULANDO ENVIO DE EMAIL ---");
         console.log("Para:", currentUser.email);
         console.log("Assunto:", emailSubject);
         console.log("Corpo:");
         console.log(emailBody.trim());
         console.log("-------------------------------");
     } else {
         console.warn("[ProductContext] Não foi possível simular o envio do email: usuário não logado ou sem email cadastrado.");
     }

     // --- Simulate sending SMS/WhatsApp ---
     if (currentUser && currentUser.phone) {
         const storeName = "MenuMaster";
         const message = `Olá ${currentUser.name}, seu pedido na ${storeName} (#${finalizedOrder.id.substring(0, 6)}) no valor de R$ ${finalizedOrder.total.toFixed(2)} foi confirmado! Obrigado!`;

         // In a real app, you would integrate with an SMS/WhatsApp API (e.g., Twilio, Zenvia) here.
         // For this mock, we just log it to the console.
         console.log("--- SIMULANDO ENVIO DE SMS/WHATSAPP ---");
         console.log("Para Telefone:", currentUser.phone);
         console.log("Mensagem:", message);
         console.log("---------------------------------------");
     } else {
          console.warn("[ProductContext] Não foi possível simular o envio de SMS/WhatsApp: usuário não logado ou sem telefone cadastrado.");
     }

     // Clear the current active order
     setOrder([]); // New empty array reference

    // Dispatch success toast
    setTimeout(() => {
        toast({
            title: "Pedido finalizado!",
            description: `Seu pedido foi confirmado e os detalhes ${currentUser?.email ? 'enviados para o seu email' : 'registrados'}.${currentUser?.phone ? ' Uma notificação também foi enviada para seu telefone.' : ''}`,
        });
    }, 0);
    //  console.log("[ProductContext] Order finalized and current order cleared."); // Reduce noise
  }, [order, toast, currentUser, storeSettings]); // Depend on the current 'order', 'currentUser', and 'storeSettings'


  // --- Reporting Functions ---

  const getISODateString = (date: Date): string => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const isDayFinalized = useCallback((date: Date): boolean => {
        const dateString = getISODateString(date);
        return monthlyReports.some(report => report.date === dateString);
  }, [monthlyReports]);

  const finalizeDay = useCallback((): boolean => {
        const today = new Date();
        const todayString = getISODateString(today);

        if (isDayFinalized(today)) {
            console.warn(`[ProductContext] Day ${todayString} has already been finalized.`);
            setTimeout(() => toast({ title: "Dia Já Finalizado", description: `O dia ${today.toLocaleDateString('pt-BR')} já foi finalizado.`, variant: "destructive" }), 0);
            return false;
        }

        // Calculate total for today's orders
         const todayTotal = completedOrders
             .filter(order => getISODateString(new Date(order.timestamp)) === todayString)
             .reduce((sum, order) => sum + order.total, 0);


        // Create the daily report entry
        const dailyReportEntry: DailyReport = {
            date: todayString,
            total: todayTotal,
        };
        //  console.log(`[ProductContext] Creating daily report for ${todayString}:`, dailyReportEntry); // Reduce noise

        // Add to monthly reports state
        setMonthlyReports(prevReports => {
            const newReports = [...prevReports, dailyReportEntry];
            // Optionally sort by date if needed
            newReports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            // console.log("[ProductContext] Monthly reports state after adding new entry:", newReports); // Reduce noise
            return newReports;
        });

        setTimeout(() => toast({ title: "Dia Finalizado", description: `Total de R$ ${todayTotal.toFixed(2)} registrado para ${today.toLocaleDateString('pt-BR')}.` }), 0);
        return true;
  }, [completedOrders, monthlyReports, isDayFinalized, toast]);


  // --- Product Management (Admin) ---
   const addProduct = useCallback((newProduct: Product): boolean => {
        // console.log("[ProductContext] Attempting to add product:", newProduct.name); // Reduce noise
        let success = false;
        let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;

        setProducts((prevProducts) => {
            // Basic validation before adding
             if (!newProduct.id || !newProduct.name || !newProduct.price || !newProduct.category) {
                 console.error("[ProductContext] Invalid product data for add:", newProduct);
                 toastInfo = { title: "Erro Interno", description: "Dados do produto inválidos.", variant: "destructive" };
                 return prevProducts; // Return original state on validation failure
             }

            const exists = prevProducts.some(p => p.id === newProduct.id);
            if (exists) {
                console.warn(`[ProductContext] Product with ID ${newProduct.id} already exists.`);
                toastInfo = {title: "Erro", description: "Produto com este ID já existe.", variant: "destructive"};
                return prevProducts; // Return original state
            }

            const updatedProducts = [...prevProducts, newProduct];
            // console.log("[ProductContext] Product added locally. New count:", updatedProducts.length); // Reduce noise
            toastInfo = { title: "Sucesso", description: `Produto "${newProduct.name}" adicionado!` };
            success = true;
            return updatedProducts; // Return new state
        });

        // Trigger toast outside the updater, based on the result
        if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
        // console.log("[ProductContext] Add operation success status:", success); // Reduce noise
        return success;
  }, [toast]); // Removed 'products' dependency, using updater function


  const updateProduct = useCallback((updatedProduct: Product): boolean => {
    //    console.log("[ProductContext] Attempting to update product:", updatedProduct.name); // Reduce noise
       let success = false;
       let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;

       setProducts((prevProducts) => {
           // Basic validation before updating
            if (!updatedProduct.id || !updatedProduct.name || !updatedProduct.price || !updatedProduct.category) {
                console.error("[ProductContext] Invalid product data for update:", updatedProduct);
                toastInfo = { title: "Erro Interno", description: "Dados do produto inválidos para atualização.", variant: "destructive" };
                return prevProducts; // Return original state on validation failure
            }

            const productIndex = prevProducts.findIndex(p => p.id === updatedProduct.id);
            if (productIndex === -1) {
                console.warn(`[ProductContext] Product with ID ${updatedProduct.id} not found for update.`);
                toastInfo = {title: "Erro", description: "Produto não encontrado para atualização.", variant: "destructive"};
                return prevProducts; // Return original state
            }

            const newProducts = [...prevProducts];
            newProducts[productIndex] = updatedProduct;
            // console.log("[ProductContext] Product updated locally."); // Reduce noise
            toastInfo = { title: "Sucesso", description: `Produto "${updatedProduct.name}" atualizado!` };
            success = true;
            return newProducts; // Return new state
       });

       if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
    //    console.log("[ProductContext] Update operation success status:", success); // Reduce noise
       return success;
  }, [toast]); // Removed 'products' dependency, using updater function


  const deleteProduct = useCallback((productId: string): boolean => {
        // console.log("[ProductContext] Attempting to delete product ID:", productId); // Reduce noise
        let success = false;
        let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;
        let productName = '';

       setProducts((prevProducts) => {
           const productToDelete = prevProducts.find(p => p.id === productId);
            if (!productToDelete) {
                 console.warn(`[ProductContext] Product with ID ${productId} not found for deletion.`);
                 toastInfo = {title: "Erro", description: "Produto não encontrado para exclusão.", variant: "destructive"};
                return prevProducts; // Return original state
            }

            productName = productToDelete.name; // Get name for toast message
            const updatedProducts = prevProducts.filter(p => p.id !== productId);
            //  console.log("[ProductContext] Product deleted locally. New count:", updatedProducts.length); // Reduce noise
            toastInfo = { title: "Sucesso", description: `Produto "${productName}" excluído!` };
            success = true;
            return updatedProducts; // Return new state
       });

       // Cleanup order if the deleted item was in it
       setOrder(prevOrder => prevOrder.filter(item => item.id !== productId));

       if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
    //    console.log("[ProductContext] Delete operation success status:", success); // Reduce noise
       return success;
  }, [toast]); // Removed 'products' dependency, using updater function


  const value = {
    products,
    order,
    completedOrders,
    monthlyReports, // Provide monthly reports
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    addProductToOrder,
    removeProductFromOrder,
    updateProductQuantity,
    clearOrder, // Finalizes the current order
    finalizeDay, // Add finalize day function
    isDayFinalized, // Add check function
    addProduct,
    updateProduct,
    deleteProduct,
  };

   if (!isInitialized) {
    //  console.log("[ProductContext] Rendering loading state."); // Reduce noise
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-center p-8">Carregando cardápio...</div>
       </div>
     );
   }

  // console.log("[ProductContext] Rendering Provider with value."); // Reduce noise
  return (
     <ProductContext.Provider value={value}>
         {children}
     </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
     console.error("useProductContext error: Context is undefined.");
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
};

