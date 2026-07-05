export interface ApiSuccessResponse {
  success: true;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: string[];
}

export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  category: ProductCategory | string;
  stock: number;
  sold: number;
  tags: string[];
  seoTitle?: string;
  metaDescription?: string;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: ProductImage;
  parent: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  images: ProductImage[];
  stock: number;
  isActive: boolean;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  itemCount: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: CartTotals;
}

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  images: ProductImage[];
  isActive: boolean;
}

export interface Wishlist {
  id: string;
  products: WishlistProduct[];
  count: number;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderItem {
  product: { id: string; name: string; images: ProductImage[] } | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  user: { id: string; name: string; email: string } | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  pages: number;
}

export interface SearchProductResult extends Product {
  score: number;
}

export interface ChatProduct {
  id: string;
  name: string;
  price: number;
}

export interface ConversationSummary {
  id: string;
  lastMessage: string | null;
  lastMessageRole: "user" | "assistant" | null;
  timestamp: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueLast30Days: { date: string; revenue: number }[];
  topProductsByRevenue: {
    productId: string;
    name: string;
    revenue: number;
    unitsSold: number;
  }[];
}

export interface InventoryProduct {
  id: string;
  name: string;
  stock: number;
  sold: number;
  price: number;
  isActive: boolean;
  image: string | null;
  category: ProductCategory | string;
}
