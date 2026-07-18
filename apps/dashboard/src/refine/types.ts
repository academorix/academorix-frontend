export type FineFoodsImage = {
  url: string;
  thumbnailUrl?: string;
  name?: string;
};

export type OrderUser = {
  id: number;
  fullName: string;
  gsm: string;
  avatar?: FineFoodsImage[];
};

export type OrderStatus = {
  id: number;
  text: string;
};

export type Order = {
  id: number;
  orderNumber: number;
  status: OrderStatus;
  amount: number;
  store?: { id: number; title: string } | string;
  user: OrderUser;
  products: { id: number; name: string }[];
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  isActive: boolean;
  description: string;
  price: number;
  images?: FineFoodsImage[];
  category?: { id: number; title?: string };
  createdAt: string;
};

export type Customer = {
  id: number;
  fullName: string;
  gender: string;
  gsm: string;
  isActive: boolean;
  avatar?: FineFoodsImage[];
  addresses?: { text: string }[];
  createdAt: string;
};

export type Category = {
  id: number;
  title: string;
  isActive: boolean;
  cover?: string;
};

export type Store = {
  id: number;
  title: string;
  isActive: boolean;
  email?: string;
  gsm?: string;
  address?: { text: string };
  createdAt: string;
};
