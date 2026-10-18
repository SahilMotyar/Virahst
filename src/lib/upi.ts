import { config } from "@/config";

/**
 * UPI deep link for the support page, or null while no UPI ID is configured.
 * No `am` (amount) parameter, so the payer chooses how much to give. `pa` is
 * left unencoded: UPI IDs are plain `name@bank`, and some UPI apps fail to
 * parse a percent-encoded `@`.
 */
export function upiPayUrl(): string | null {
  const { upiId, upiPayeeName } = config.support;
  if (!upiId) return null;
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayeeName)}&cu=INR&tn=Virasat%20support`;
}
