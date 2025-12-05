'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { computeTotals, CouponLike } from "@/lib/pricing";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  slug: string;
  image?: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  coupon?: CouponLike | null;
  couponCode?: string;
};

type Action =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QTY"; productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "SET_COUPON"; coupon: CouponLike | null; code?: string };

type CartContextValue = CartState & {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  setCoupon: (coupon: CouponLike | null, code?: string) => void;
};

const initialState: CartState = {
  items: [],
  coupon: null,
  couponCode: undefined,
};

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.productId),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.productId === action.productId
              ? { ...i, quantity: Math.max(1, action.quantity) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return initialState;
    case "SET_COUPON":
      return { ...state, coupon: action.coupon, couponCode: action.code };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", productId, quantity });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const setCoupon = useCallback((coupon: CouponLike | null, code?: string) => {
    dispatch({ type: "SET_COUPON", coupon, code });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      setCoupon,
    }),
    [state, addItem, removeItem, updateQuantity, clear, setCoupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
}

export function useCartStore<T = CartContextValue>(
  selector?: (state: CartContextValue) => T,
) {
  const context = useCartContext();
  return selector ? selector(context) : context;
}

export function useCartTotals() {
  const { items, coupon } = useCartContext();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totals = computeTotals(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    coupon ?? undefined,
  );
  return { ...totals, itemCount };
}
