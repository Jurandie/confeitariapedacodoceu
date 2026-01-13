import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";
import { getSiteConfig, saveSiteConfig } from "@/lib/server/storefront-data";

const DEFAULT_HERO = {
  heroTitle: "Confeitaria Pedaço Do Céu e um playground acucarado para uma confeiteira digital.",
  heroDescription:
    "Aqui a vitrine virtual recebe receitas fresquinhas: cupcakes florais, brigadeiros gourmet e tortas de festa. O painel da dona funciona como o caderno de receitas que nunca fecha -- crie lotes, ajuste precos e publique fotos direto da cozinha.",
  heroBadge: "vitrine artesanal + finalizar pedido",
  heroPanelTopTitle: "Jornal da cozinha",
  heroPanelTopDescription:
    "Receitas novas, ajustes de preco e fotos atualizadas direto da cozinha da Confeitaria Pedaço Do Céu.",
  heroPanelBottomTitle: "Panelinha da Confeitaria Pedaço Do Céu",
  heroPanelBottomDescription:
    "Dashboard com relatorio de estoque, doces mais pedidos e campanhas de novos sabores. Tudo pronto para registrar novas delicias.",
  heroPanelFooter:
    "Replique cenarios reais de confeitaria sem precisar de Stripe real. Ideal para apresentar jornadas completas e pontos de personalizacao para clientes gulosos.",
};

export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json(config ?? { id: "hero", ...DEFAULT_HERO });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    heroTitle?: string;
    heroDescription?: string;
    heroBadge?: string;
    heroPanelTopTitle?: string;
    heroPanelTopDescription?: string;
    heroPanelBottomTitle?: string;
    heroPanelBottomDescription?: string;
    heroPanelFooter?: string;
  };

  const heroTitle = payload.heroTitle?.trim();
  const heroDescription = payload.heroDescription?.trim();
  const heroBadge = payload.heroBadge?.trim();
  const heroPanelTopTitle = payload.heroPanelTopTitle?.trim();
  const heroPanelTopDescription = payload.heroPanelTopDescription?.trim();
  const heroPanelBottomTitle = payload.heroPanelBottomTitle?.trim();
  const heroPanelBottomDescription = payload.heroPanelBottomDescription?.trim();
  const heroPanelFooter = payload.heroPanelFooter?.trim();

  if (
    !heroTitle ||
    !heroDescription ||
    !heroBadge ||
    !heroPanelTopTitle ||
    !heroPanelTopDescription ||
    !heroPanelBottomTitle ||
    !heroPanelBottomDescription ||
    !heroPanelFooter
  ) {
    return NextResponse.json(
      { message: "Preencha todos os campos do painel principal." },
      { status: 400 },
    );
  }

  const updated = await saveSiteConfig({
    heroTitle,
    heroDescription,
    heroBadge,
    heroPanelTopTitle,
    heroPanelTopDescription,
    heroPanelBottomTitle,
    heroPanelBottomDescription,
    heroPanelFooter,
  });

  return NextResponse.json({ ok: true, config: updated });
}
