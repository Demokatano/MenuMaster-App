
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string; // Added category field
}

// Added User type
export interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  cpf: string; // Added CPF field
  address: string;
  cep: string; // Added CEP field
  houseNumber: string; // Added house number field
  phone: string;
  // IMPORTANT: Storing plain text passwords is highly insecure and only for demonstration purposes.
  // In a real application, use a strong hashing algorithm (e.g., bcrypt) to store password hashes.
  passwordPlain: string;
}

// Added Admin type (simplified)
export interface Admin {
  id: string;
  login: string;
  // IMPORTANT: Use secure password hashing for admin passwords as well.
  // For mock purposes, using plain text like the User type.
  passwordPlain: string; // Store plain text password (INSECURE MOCK)
}

// Represents an item within a completed order
export interface CompletedOrderItem {
    id: string; // Product ID
    name: string;
    price: number; // Price at the time of order
    quantity: number;
}

// Represents a finalized order saved for reporting
export interface CompletedOrder {
    id: string; // Unique order ID (e.g., timestamp + random string)
    timestamp: number; // Unix timestamp when the order was completed
    items: CompletedOrderItem[];
    total: number;
    userId?: string; // Optional: ID of the user who placed the order
}

// Represents a finalized daily total stored for the general report
export interface DailyReport {
    date: string; // ISO date string (YYYY-MM-DD)
    total: number;
}

// Type for updating user data
export interface UpdateUserData {
  id: string; // ID of the user to update
  login?: string; // Optional: Allow login update
  name: string;
  email: string;
  cpf?: string; // Optional: Allow CPF update
  address: string;
  cep: string;
  houseNumber: string;
  phone: string;
  currentPassword?: string; // Optional: Only needed if changing password as the user
  newPassword?: string;     // Optional: The new password
  isPasswordReset?: boolean; // Optional flag for user password reset flow simulation
  isAdminPasswordReset?: boolean; // Optional flag for admin password reset (bypasses current password check)
}
