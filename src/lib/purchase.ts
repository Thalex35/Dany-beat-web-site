import { track } from "@/lib/analytics";

export type PurchaseIntent = {
  beatId: string;
  beatTitle: string;
  licenseName?: string | null;
  price?: number | null;
  producerName: string;
  buyerName?: string | null;
  whatsappNumber: string;
};

export type PurchaseProvider = {
  id: string;
  label: string;
  /** Returns true when the provider can handle the intent. */
  isConfigured: (intent: PurchaseIntent) => boolean;
  start: (intent: PurchaseIntent) => Promise<void> | void;
};

function buildWhatsappMessage(intent: PurchaseIntent) {
  const lines = [
    `Hello ${intent.producerName}, I'm interested in purchasing the beat "${intent.beatTitle}".`,
    intent.licenseName ? `License: ${intent.licenseName}` : null,
    typeof intent.price === "number" && intent.price > 0 ? `Listed price: $${intent.price}` : null,
    intent.buyerName ? `My name: ${intent.buyerName}` : null,
    `Beat ID: ${intent.beatId}`,
    "I found it on your website and would like to know the available licenses and pricing.",
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * MVP checkout provider. Swapping in Stripe/Paddle later means adding another
 * provider here — callers only ever use `startPurchase`.
 */
export const whatsappProvider: PurchaseProvider = {
  id: "whatsapp",
  label: "Inquire via WhatsApp",
  isConfigured: (intent) => !!intent.whatsappNumber?.replace(/\D/g, ""),
  start: async (intent) => {
    const phone = intent.whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(intent))}`;
    await track("whatsapp_click", { beatId: intent.beatId });
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

export const activeProvider: PurchaseProvider = whatsappProvider;

export function startPurchase(intent: PurchaseIntent) {
  return activeProvider.start(intent);
}
