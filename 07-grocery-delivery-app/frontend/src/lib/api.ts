const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'PICKER_DRIVER' | 'STORE_ADMIN';
  phone?: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  unitType: 'EACH' | 'PER_KG' | 'PER_LB';
  stockQuantity: number;
  imageUrl: string;
  aisle: string;
  isOrganic: boolean;
}

export interface DeliverySlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isSoldOut: boolean;
  status: 'AVAILABLE' | 'SOLD_OUT';
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' | 'CONTACT_ME' | 'DO_NOT_SUBSTITUTE';
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  deliverySlotId: string;
  deliverySlotDate: string;
  deliverySlotTime: string;
  deliveryAddress: string;
  contactPhone: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  driverTip: number;
  totalAmount: number;
  status: 'PLACED' | 'PICKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  paymentRef?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  frequency: 'WEEKLY' | 'BI_WEEKLY';
  preferredDay: string;
  preferredSlotTime: string;
  itemsSummary: string;
  isActive: boolean;
  nextScheduledAt: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `HTTP error ${res.status}`);
  }

  return data as T;
}
