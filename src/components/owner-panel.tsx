'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProductDTO } from "@/types";
import {
  createProduct,
  updateProductPrice,
  uploadProductImage,
  updateHeroContent,
  deleteProduct,
} from "@/lib/client-api";
import { formatCurrency } from "@/lib/pricing";

type Props = {
  initialProducts: ProductDTO[];
  initialHeroCopy: {
    heroTitle: string;
    heroDescription: string;
    heroBadge: string;
    heroPanelTopTitle: string;
    heroPanelTopDescription: string;
    heroPanelBottomTitle: string;
    heroPanelBottomDescription: string;
    heroPanelFooter: string;
  };
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: string;
};

const initialFormState: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "20",
  category: "doces",
  image: "",
};

function parsePrice(value: string) {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function normalizeImagePath(value: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  const filename = trimmed.replace(/\\/g, "/").split("/").pop();
  if (!filename) return undefined;
  return `/products/${filename}`;
}

export function OwnerPanel({ initialProducts, initialHeroCopy }: Props) {
  const router = useRouter();
  const { status, owner, pending, requestCode, login, logout } = useAuth();
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [formState, setFormState] = useState<ProductFormState>(initialFormState);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [imageUploadMessage, setImageUploadMessage] = useState<string | null>(null);
  const [savingNewProduct, setSavingNewProduct] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(initialProducts[0]?.id ?? "");
  const [priceInput, setPriceInput] = useState("");
  const [heroTitle, setHeroTitle] = useState(initialHeroCopy.heroTitle);
  const [heroDescription, setHeroDescription] = useState(initialHeroCopy.heroDescription);
  const [heroMessage, setHeroMessage] = useState<string | null>(null);
  const [heroBadge, setHeroBadge] = useState(initialHeroCopy.heroBadge);
  const [panelTopTitle, setPanelTopTitle] = useState(initialHeroCopy.heroPanelTopTitle);
  const [panelTopDescription, setPanelTopDescription] = useState(
    initialHeroCopy.heroPanelTopDescription,
  );
  const [panelBottomTitle, setPanelBottomTitle] = useState(initialHeroCopy.heroPanelBottomTitle);
  const [panelBottomDescription, setPanelBottomDescription] = useState(
    initialHeroCopy.heroPanelBottomDescription,
  );
  const [panelFooter, setPanelFooter] = useState(initialHeroCopy.heroPanelFooter);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setImageUploadMessage(null);
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const path = await uploadProductImage(file);
      setFormState((prev) => ({ ...prev, image: path }));
      setImageUploadMessage("Imagem anexada com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.";
      setImageUploadMessage(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleHeroUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHeroMessage(null);
    if (
      !heroTitle.trim() ||
      !heroDescription.trim() ||
      !heroBadge.trim() ||
      !panelTopTitle.trim() ||
      !panelTopDescription.trim() ||
      !panelBottomTitle.trim() ||
      !panelBottomDescription.trim() ||
      !panelFooter.trim()
    ) {
      setHeroMessage("Preencha todos os campos da vitrine/painel.");
      return;
    }
    try {
      const updated = await updateHeroContent({
        heroTitle: heroTitle.trim(),
        heroDescription: heroDescription.trim(),
        heroBadge: heroBadge.trim(),
        heroPanelTopTitle: panelTopTitle.trim(),
        heroPanelTopDescription: panelTopDescription.trim(),
        heroPanelBottomTitle: panelBottomTitle.trim(),
        heroPanelBottomDescription: panelBottomDescription.trim(),
        heroPanelFooter: panelFooter.trim(),
      });
      setHeroTitle(updated.heroTitle);
      setHeroDescription(updated.heroDescription);
      setHeroBadge(updated.heroBadge);
      setPanelTopTitle(updated.heroPanelTopTitle);
      setPanelTopDescription(updated.heroPanelTopDescription);
      setPanelBottomTitle(updated.heroPanelBottomTitle);
      setPanelBottomDescription(updated.heroPanelBottomDescription);
      setPanelFooter(updated.heroPanelFooter);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("site-config:update", { detail: updated }));
      }
      setHeroMessage("Painel atualizado!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar o painel.";
      setHeroMessage(message);
    }
  };

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    if (!loginEmail) {
      setLoginError("Informe o email da dona para receber o codigo.");
      return;
    }
    const response = await requestCode(loginEmail);
    if (!response.success) {
      setCodeInfo(null);
      setLoginError(response.message ?? "Nao foi possivel enviar o codigo.");
      return;
    }
    setCodeInfo(response.message ?? "Codigo enviado para o email cadastrado.");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    if (!loginEmail || !codeInput) {
      setLoginError("Preencha email e codigo para acessar.");
      return;
    }
    const result = await login(loginEmail, codeInput);
    if (!result.success) {
      setLoginError(result.message ?? "Nao foi possivel autenticar.");
    } else {
      setLoginError(null);
      setCodeInfo(null);
      setCodeInput("");
    }
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateMessage(null);
    if (!formState.image) {
      setCreateMessage("Envie a foto do doce antes de publicar.");
      return;
    }
    const price = parsePrice(formState.price);
    if (!price || price <= 0) {
      setCreateMessage("Preencha um preco valido (ex: 12,50).");
      return;
    }
    setSavingNewProduct(true);
    try {
      const product = await createProduct({
        name: formState.name.trim(),
        description: formState.description.trim(),
        price,
        stock: Number.parseInt(formState.stock, 10) || 0,
        category: formState.category.trim(),
        image: normalizeImagePath(formState.image),
      });
      setProducts((prev) => [...prev, product]);
      setSelectedProductId(product.id);
      setFormState(initialFormState);
      setCreateMessage("Novo doce publicado com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar doce.";
      setCreateMessage(message);
    } finally {
      setSavingNewProduct(false);
    }
  };

  const handleUpdatePrice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateMessage(null);
    if (!selectedProductId) {
      setUpdateMessage("Selecione um doce para ajustar o preco.");
      return;
    }
    const price = parsePrice(priceInput);
    if (!price || price <= 0) {
      setUpdateMessage("Defina um preco valido para atualizar.");
      return;
    }
    setSavingPrice(true);
    try {
      const updated = await updateProductPrice(selectedProductId, price);
      setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
      setPriceInput("");
      setUpdateMessage("Preco atualizado. O catalogo ja reflete o novo valor.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao conseguimos atualizar o preco agora.";
      setUpdateMessage(message);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeleteProduct = async () => {
    setUpdateMessage(null);
    if (!selectedProductId) {
      setUpdateMessage("Selecione um doce para remover.");
      return;
    }
    console.log("[owner-panel] tentando remover", selectedProductId);
    setDeletingProduct(true);
    try {
      console.log("Deleting product", selectedProductId);
      await deleteProduct(selectedProductId);
      setProducts((prev) => {
        const updated = prev.filter((product) => product.id !== selectedProductId);
        setSelectedProductId(updated[0]?.id ?? "");
        return updated;
      });
      setPriceInput("");
      setUpdateMessage("Doce removido com sucesso.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel remover o doce.";
      setUpdateMessage(message);
    } finally {
      setDeletingProduct(false);
    }
  };

  return (
    <section
      id="painel-da-dona"
      className="rounded-3xl bg-linear-to-br from-[#fff5e5] via-[#ffe3c2] to-[#ffd08d] p-8 shadow-lg"
    >
        <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--jl-crimson)]/70">
          Painel da dona
        </p>
        <h2 className="text-3xl font-semibold text-[var(--jl-crimson-dark)]">
          {status === "authenticated" && owner
            ? `Bem-vinda de volta, ${owner.name.split(" ")[0]}`
            : "Cuide do seu cardapio de doces"}
        </h2>
        <p className="text-sm text-[var(--jl-crimson)]">
          Aqui voce adiciona novidades e ajusta precos da vitrine. Apenas a dona autenticada pode
          mexer nos doces.
        </p>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-[var(--jl-crimson)]">Carregando estado da sessao...</p>
      )}

      {status !== "authenticated" && status !== "loading" && (
        <div className="mt-6 grid gap-4 rounded-2xl bg-white/70 p-6 text-sm shadow-inner">
          <form className="grid gap-4" onSubmit={handleRequestCode}>
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                Email da dona
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="dona@doces.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white/80 px-4 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-[var(--jl-amber)] px-4 py-2 font-semibold text-[var(--jl-crimson)] transition hover:bg-[#fff5e5]"
              disabled={pending}
            >
              {pending ? "Enviando codigo..." : "Enviar codigo de acesso"}
            </button>
          </form>
          <form className="grid gap-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-code" className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                Codigo recebido por email
              </label>
              <input
                id="login-code"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white/80 px-4 py-2 tracking-[0.3em]"
                required
              />
            </div>
            {codeInfo && <p className="text-xs text-[var(--jl-crimson)]/80">{codeInfo}</p>}
            {loginError && <p className="text-sm text-[#b21b1f]">{loginError}</p>}
            <button
              type="submit"
              className="rounded-xl bg-[var(--jl-crimson)] px-4 py-2 font-semibold text-white transition hover:bg-[#fff5e5]0"
              disabled={pending}
            >
              {pending ? "Verificando..." : "Acessar painel"}
            </button>
            <p className="text-xs text-[var(--jl-crimson)]/80">
              Cada acesso usa um codigo novo enviado para o email cadastrado.
            </p>
          </form>
        </div>
      )}

      {status === "authenticated" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-5 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--jl-crimson-dark)]">Cadastrar doce</h3>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-[var(--jl-crimson)]/80 underline"
                disabled={pending}
              >
                Sair
              </button>
            </div>
            <form className="mt-4 space-y-4 text-sm" onSubmit={handleCreateProduct}>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Nome do doce
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">Descricao</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  rows={3}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">Preco (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                    placeholder="12,90"
                    value={formState.price}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, price: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">Estoque</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                    value={formState.stock}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, stock: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                    Categoria
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                    value={formState.category}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, category: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                    Foto do doce
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2 text-sm"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {formState.image && (
                    <p className="mt-1 text-xs text-[var(--jl-crimson)]/80 break-all">{formState.image}</p>
                  )}
                  {imageUploadMessage && (
                    <p className="mt-1 text-xs text-[var(--jl-crimson)]/80">{imageUploadMessage}</p>
                  )}
                </div>
              </div>
              {createMessage && <p className="text-sm text-[var(--jl-crimson)]">{createMessage}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-[var(--jl-crimson)] px-4 py-2 font-semibold text-white transition hover:bg-[#fff5e5]0"
                disabled={savingNewProduct}
              >
                {savingNewProduct ? "Publicando..." : "Adicionar doce"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 shadow">
            <h3 className="text-lg font-semibold text-[var(--jl-crimson-dark)]">Reajustar preco ou remover</h3>
            <form className="mt-4 space-y-4 text-sm" onSubmit={handleUpdatePrice}>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">Produto</label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                  {products.length === 0 && <option>Nenhum doce cadastrado</option>}
                </select>
              </div>
              {selectedProduct && (
                <p className="text-xs text-[var(--jl-crimson)]/80">
                  Preco atual: <strong>{formatCurrency(selectedProduct.price)}</strong>
                </p>
              )}
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Novo preco (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="15,00"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                />
              </div>
              {updateMessage && <p className="text-sm text-[var(--jl-crimson)]">{updateMessage}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--jl-gold)] px-4 py-2 font-semibold text-[var(--jl-crimson)] transition hover:bg-[#ffd76b]"
                  disabled={savingPrice || products.length === 0}
                >
                  {savingPrice ? "Salvando..." : "Atualizar valor"}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--jl-amber)] px-4 py-2 font-semibold text-[var(--jl-crimson)] transition hover:bg-[#fff5e5]"
                  onClick={handleDeleteProduct}
                  disabled={deletingProduct || products.length === 0}
                >
                  {deletingProduct ? "Removendo..." : "Excluir doce"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-white/80 p-5 shadow md:col-span-2">
            <h3 className="text-lg font-semibold text-[var(--jl-crimson-dark)]">Narrativa da vitrine</h3>
            <p className="text-sm text-[var(--jl-crimson)]">
              Personalize o titulo, descricao e cartoes do painel principal da loja.
            </p>
            <form className="mt-4 space-y-4 text-sm" onSubmit={handleHeroUpdate}>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Titulo do banner
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={heroTitle}
                  onChange={(event) => setHeroTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Titulo do cartao principal
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={panelTopTitle}
                  onChange={(event) => setPanelTopTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Descricao do cartao principal
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  rows={3}
                  value={panelTopDescription}
                  onChange={(event) => setPanelTopDescription(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Titulo do cartao secundario
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={panelBottomTitle}
                  onChange={(event) => setPanelBottomTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Descricao do cartao secundario
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  rows={3}
                  value={panelBottomDescription}
                  onChange={(event) => setPanelBottomDescription(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Texto de apoio do painel
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  rows={3}
                  value={panelFooter}
                  onChange={(event) => setPanelFooter(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Descricao do banner
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  rows={4}
                  value={heroDescription}
                  onChange={(event) => setHeroDescription(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Destaque da vitrine
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-[#f2c27b] bg-white px-4 py-2"
                  value={heroBadge}
                  onChange={(event) => setHeroBadge(event.target.value)}
                />
                <p className="mt-1 text-xs text-[var(--jl-crimson)]/80">
                  Este texto aparece como etiqueta na header da loja.
                </p>
              </div>
              {heroMessage && <p className="text-sm text-[var(--jl-crimson)]">{heroMessage}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-[var(--jl-crimson)] px-4 py-2 font-semibold text-white transition hover:bg-[#fff5e5]0"
              >
                Atualizar banner
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
