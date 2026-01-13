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

function dataUrlToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

async function compressImage(file: File, opts?: { maxSize?: number; quality?: number }) {
  const maxSize = opts?.maxSize ?? 1400; // px
  const quality = opts?.quality ?? 0.8;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponivel para comprimir imagem.");
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const compressedDataUrl = await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Nao foi possivel comprimir a imagem."));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler blob comprimido."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      quality,
    );
  });

  const compressedFile = dataUrlToFile(
    compressedDataUrl,
    `doce-${Date.now()}-${file.name.replace(/\s+/g, "-")}.jpg`,
  );
  return { compressedFile, previewDataUrl: compressedDataUrl };
}

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
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  const filename = trimmed.replace(/\\/g, "/").split("/").pop();
  if (!filename) return undefined;
  return `/products/${filename}`;
}

export function OwnerPanel({ initialProducts, initialHeroCopy }: Props) {
  const router = useRouter();
  const { status, owner, pending, login, logout } = useAuth();
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [formState, setFormState] = useState<ProductFormState>(initialFormState);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [imageUploadMessage, setImageUploadMessage] = useState<string | null>(null);
  const [savingNewProduct, setSavingNewProduct] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(initialProducts[0]?.id ?? "");
  const [priceInput, setPriceInput] = useState("");
  const [imagePreview, setImagePreview] = useState<{ src: string; name: string } | null>(null);
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
      const { compressedFile, previewDataUrl } = await compressImage(file).catch(() => ({
        compressedFile: file,
        previewDataUrl: null,
      }));
      const path = await uploadProductImage(compressedFile);
      setFormState((prev) => ({ ...prev, image: path }));
      setImagePreview({ src: previewDataUrl ?? path, name: compressedFile.name });
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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    if (!loginPhone || !loginPassword) {
      setLoginError("Preencha login e senha para acessar.");
      return;
    }
    const result = await login(loginPhone, loginPassword);
    if (!result.success) {
      setLoginError(result.message ?? "Nao foi possivel autenticar.");
    } else {
      setLoginError(null);
      setLoginPassword("");
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
      setImagePreview(null);
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
      className="relative overflow-hidden rounded-3xl border border-[var(--jl-amber)]/40 p-8 shadow-xl jl-paper jl-reveal"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border-2 border-dotted border-[var(--jl-crimson)]/30"
      />
      <div className="flex flex-col gap-3">
        <p className="jl-pill inline-flex items-center border border-[var(--jl-amber)]/70 bg-[var(--jl-cream)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--jl-crimson)]">
          Painel da dona
        </p>
        <h2 className="jl-display text-3xl font-semibold text-[var(--jl-crimson-dark)]">
          {status === "authenticated" && owner
            ? `Bem-vinda de volta, ${owner.name.split(" ")[0]}`
            : "Acesse com login e senha"}
        </h2>
        <div aria-hidden="true" className="h-2 w-28 jl-dotted-divider opacity-70" />
        <p className="text-sm text-[var(--jl-crimson)]/80">
          Digite o login cadastrado e a senha da dona para entrar. Apenas a dona autenticada pode mexer nos doces.
        </p>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-[var(--jl-crimson)]">Carregando estado da sessao...</p>
      )}

      {status !== "authenticated" && status !== "loading" && (
        <div className="mt-6 grid gap-4 rounded-2xl p-6 text-sm jl-paper">
          <form className="grid gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-identifier" className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                Login
              </label>
              <input
                id="login-identifier"
                name="login"
                type="text"
                autoComplete="username"
                placeholder="Digite seu login"
                value={loginPhone}
                onChange={(event) => setLoginPhone(event.target.value)}
                className="w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)]/90 px-4 py-2"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                Senha
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Senha da dona"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)]/90 px-4 py-2"
                required
              />
            </div>
            {loginError && <p className="text-sm text-[var(--jl-crimson)]">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--jl-crimson)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--jl-crimson-dark)]"
              disabled={pending}
            >
              {pending ? "Verificando..." : "Entrar com login e senha"}
            </button>
            <p className="text-xs text-[var(--jl-crimson)]/80">
              Acesso exclusivo com login e senha cadastrados da dona.
            </p>
          </form>
        </div>
      )}

      {status === "authenticated" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl p-5 jl-paper">
            <div className="flex items-center justify-between">
              <h3 className="jl-display text-lg font-semibold text-[var(--jl-crimson-dark)]">Cadastrar doce</h3>
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                    className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                    className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                    className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                    className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2 text-sm"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {imagePreview && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--jl-amber)]/70 bg-[var(--jl-cream)] p-2">
                      <div className="h-16 w-16 overflow-hidden rounded-lg bg-[var(--jl-sand)]">
                        <img
                          src={imagePreview.src}
                          alt={`Preview de ${imagePreview.name}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-[var(--jl-crimson)]/90">
                        <p className="font-semibold">Imagem anexada</p>
                        <p className="max-w-[160px] truncate" title={imagePreview.name}>
                          {imagePreview.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {imageUploadMessage && (
                    <p className="mt-1 text-xs text-[var(--jl-crimson)]/80">{imageUploadMessage}</p>
                  )}
                </div>
              </div>
              {createMessage && <p className="text-sm text-[var(--jl-crimson)]">{createMessage}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-[var(--jl-crimson)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--jl-crimson-dark)]"
                disabled={savingNewProduct}
              >
                {savingNewProduct ? "Publicando..." : "Adicionar doce"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-5 jl-paper">
            <h3 className="jl-display text-lg font-semibold text-[var(--jl-crimson-dark)]">Reajustar preco ou remover</h3>
            <form className="mt-4 space-y-4 text-sm" onSubmit={handleUpdatePrice}>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">Produto</label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                />
              </div>
              {updateMessage && <p className="text-sm text-[var(--jl-crimson)]">{updateMessage}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--jl-gold)] px-4 py-2 font-semibold text-[var(--jl-crimson)] transition hover:bg-[var(--jl-amber)]"
                  disabled={savingPrice || products.length === 0}
                >
                  {savingPrice ? "Salvando..." : "Atualizar valor"}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--jl-amber)] px-4 py-2 font-semibold text-[var(--jl-crimson)] transition hover:bg-[var(--jl-sand)]"
                  onClick={handleDeleteProduct}
                  disabled={deletingProduct || products.length === 0}
                >
                  {deletingProduct ? "Removendo..." : "Excluir doce"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl p-5 jl-paper md:col-span-2">
            <h3 className="jl-display text-lg font-semibold text-[var(--jl-crimson-dark)]">Narrativa da vitrine</h3>
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
                  value={panelTopTitle}
                  onChange={(event) => setPanelTopTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Descricao do cartao principal
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
                  value={panelBottomTitle}
                  onChange={(event) => setPanelBottomTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--jl-crimson)]/80">
                  Descricao do cartao secundario
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                  className="mt-1 w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-4 py-2"
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
                className="w-full rounded-xl bg-[var(--jl-crimson)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--jl-crimson-dark)]"
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


