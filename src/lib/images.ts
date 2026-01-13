export function resolveProductImage(image?: string | null) {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) return trimmed;

  if (trimmed.startsWith("/products/") && trimmed.includes("base64,")) {
    const payload = trimmed.replace(/^\/products\//, "");
    return `data:image/${payload}`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  return null;
}
