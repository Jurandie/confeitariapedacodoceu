'use client';

import { ReactNode } from "react";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";

type Props = {
  children: ReactNode;
};

export default function ClientShell({ children }: Props) {
  return (
    <Providers>
      <AuthProvider>
        <CartProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">{children}</main>
        </CartProvider>
      </AuthProvider>
    </Providers>
  );
}
