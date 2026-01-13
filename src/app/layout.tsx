import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";
import ClientShell from "./client-shell";

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Confeitaria Pedaço Do Céu",
  description:
    "Confeitaria Pedaço Do Céu - loja virtual de doces artesanais com carrinho, finalizacao de pedido e painel da dona.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${body.variable} ${display.variable} ${mono.variable} antialiased`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
