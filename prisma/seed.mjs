import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coupons = [
  { code: "BEMVINDO10", type: "PERCENT", value: 10, minValue: 10000, usageLimit: 200 },
  { code: "FRETEGRATIS", type: "FIXED", value: 2500, minValue: 15000, usageLimit: 300 },
  { code: "VEMDOCARAMELO", type: "PERCENT", value: 15, minValue: 25000, usageLimit: 80 },
];

const heroContent = {
  id: "hero",
  heroTitle: "JLsaborperfeito e um playground açucarado para uma confeiteira digital.",
  heroDescription:
    "Aqui a vitrine virtual recebe receitas fresquinhas: cupcakes florais, brigadeiros gourmet e tortas de festa. O painel da dona funciona como o caderno de receitas que nunca fecha — crie lotes, ajuste preços e publique fotos direto da cozinha.",
};

async function main() {
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }

  await prisma.siteConfig.upsert({
    where: { id: heroContent.id },
    update: heroContent,
    create: heroContent,
  });

  console.log("Seed finalizado apenas com cupons. Cadastre doces manualmente pelo painel.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
