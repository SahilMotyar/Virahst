/**
 * /support — donations. The UPI QR is generated here, in a Server Component,
 * so it is baked into the static HTML at build time and no QR library ships to
 * the browser. Both payment cards hide themselves while their config is "".
 */

import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { config } from "@/config";
import { upiPayUrl } from "@/lib/upi";
import { PageHeader } from "@/components/ui/PageHeader";
import { pill, textLink } from "@/components/ui/pill";
import { CopyButton } from "@/components/support/CopyButton";

export const metadata: Metadata = {
  title: `Support — ${config.brand}`,
  description:
    "Virasat is free, with no ads and no sign-up. Chip in by UPI to help add more of India's old everyday design.",
};

const card = "rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6";
const h2 = "font-display text-2xl leading-tight text-ink";

export default async function SupportPage() {
  const { upiId, upiPayeeName, kofiUrl } = config.support;
  const upiUrl = upiPayUrl();
  const qrSvg = upiUrl
    ? await QRCode.toString(upiUrl, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1a1a1a", light: "#ffffff" },
      })
    : null;

  return (
    <main
      translate="no"
      className="mx-auto min-h-screen max-w-3xl px-5 pb-40 pt-24 sm:px-8"
    >
      <PageHeader devanagari="सहयोग करें" title="Support Virasat" />
      <p className="mt-4 max-w-prose text-base leading-7 text-ink">
        Virasat is a passion project — free, no ads, no sign-up. If it made you
        smile, or saved you hours hunting for design references, you can chip
        in. Your support helps me spend more time finding, cleaning and adding
        more of India’s old everyday design.
      </p>

      {(upiUrl || kofiUrl) && (
        <div
          className={`mt-10 grid items-start gap-5 ${
            upiUrl && kofiUrl ? "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : "max-w-md"
          }`}
        >
          {upiUrl && qrSvg && (
            <section aria-labelledby="upi" className={card}>
              <h2 id="upi" className={h2}>
                Pay with UPI (India)
              </h2>

              <div
                role="img"
                aria-label={`UPI QR code for ${upiPayeeName}`}
                className="mx-auto mt-5 aspect-square w-full max-w-[232px] rounded-2xl p-2 ring-1 ring-black/5 [&>svg]:h-full [&>svg]:w-full"
                // Trusted markup: generated above by `qrcode` from our own config.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />

              <p className="mt-5 text-sm leading-relaxed text-ink-2">
                Scan with any UPI app — GPay, PhonePe, Paytm, BHIM. Any amount is
                welcome. There are no fees, so all of it reaches Virasat.
              </p>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-bg py-1.5 pl-4 pr-1.5">
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-2">
                    UPI ID
                  </span>
                  <span className="block break-all text-[15px] font-medium text-ink">
                    {upiId}
                  </span>
                </span>
                <CopyButton text={upiId} srLabel="UPI ID" className={`${pill.soft} shrink-0`} />
              </div>

              <a href={upiUrl} className={`${pill.primary} mt-4 w-full md:hidden`}>
                Open UPI app
              </a>
            </section>
          )}

          {kofiUrl && (
            <section aria-labelledby="kofi" className={card}>
              <h2 id="kofi" className={h2}>
                Outside India?
              </h2>
              <a
                href={kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${pill.primary} mt-5`}
              >
                Support on Ko-fi
              </a>
            </section>
          )}
        </div>
      )}

      <p className="mt-12 max-w-prose text-sm leading-relaxed text-ink-2">
        Can’t donate? That’s completely fine. Sharing Virasat with a friend, or{" "}
        <Link href="/about#help" className={textLink}>
          sending an old photo
        </Link>
        , helps just as much.
      </p>
    </main>
  );
}
