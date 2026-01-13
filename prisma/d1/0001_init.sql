-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "minValue" INTEGER,
    "expiresAt" DATETIME,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "shipping" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentIntentId" TEXT,
    "couponId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwnerAccessCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "heroBadge" TEXT NOT NULL DEFAULT 'vitrine artesanal + finalizar pedido',
    "heroPanelTopTitle" TEXT NOT NULL DEFAULT 'Jornal da cozinha',
    "heroPanelTopDescription" TEXT NOT NULL DEFAULT 'Receitas novas, ajustes de preco e fotos atualizadas direto da cozinha da JL.',
    "heroPanelBottomTitle" TEXT NOT NULL DEFAULT 'Panelinha da JL',
    "heroPanelBottomDescription" TEXT NOT NULL DEFAULT 'Dashboard com relatorio de estoque, doces mais pedidos e campanhas de frete gratuito. Tudo pronto para registrar novas delicias.',
    "heroPanelFooter" TEXT NOT NULL DEFAULT 'Replique cenarios reais de confeitaria sem precisar de Stripe real. Ideal para apresentar jornadas completas e pontos de personalizacao para clientes gulosos.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "OwnerAccessCode_email_expiresAt_idx" ON "OwnerAccessCode"("email", "expiresAt");

