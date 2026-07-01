const CART_KEY = "nandalaya_cart";

export type CartItem = {
  product_id: string;
  product_name: string;
  size_id: string | null;
  size_label: string;
  price: number;
  qty: number;
};

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: Omit<CartItem, "qty"> & { qty?: number }): CartItem[] {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (c) =>
      c.product_id === item.product_id &&
      c.size_id === item.size_id
  );

  if (existingIndex >= 0) {
    cart[existingIndex].qty += item.qty || 1;
  } else {
    cart.push({ ...item, qty: item.qty || 1 });
  }

  setCart(cart);
  return cart;
}

export function updateCartQty(index: number, qty: number): CartItem[] {
  const cart = getCart();
  if (qty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = qty;
  }
  setCart(cart);
  return cart;
}

export function removeFromCart(index: number): CartItem[] {
  const cart = getCart();
  cart.splice(index, 1);
  setCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}
