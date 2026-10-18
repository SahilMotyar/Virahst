/**
 * /about — why Virasat exists, who it's for, how to contribute, and how to get
 * in touch. Contact details all come from `config.contact`; any left as ""
 * are simply not rendered.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { pill, textLink } from "@/components/ui/pill";
import { EmailLink } from "@/components/about/EmailLink";

export const metadata: Metadata = {
  title: `About — ${config.brand}`,
  description:
    "Why Virasat exists, who it's for, and how you can help build the archive of India's everyday design.",
};

const card = "rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6";
const h2 = "font-display text-2xl leading-tight text-ink sm:text-[28px]";
const body = "text-base leading-7 text-ink";

export default function AboutPage() {
  const { emailUser, emailDomain, githubProfile, githubRepo, instagram } =
    config.contact;
  const issuesUrl = githubRepo ? `${githubRepo.replace(/\/$/, "")}/issues` : "";
  const hasContact = Boolean((emailUser && emailDomain) || githubProfile || instagram);

  return (
    <main
      translate="no"
      className="mx-auto min-h-screen max-w-3xl px-5 pb-40 pt-24 sm:px-8"
    >
      <p
        role="note"
        className="rounded-2xl bg-accent/10 px-4 py-3 text-sm leading-relaxed text-ink sm:px-5"
      >
        <strong className="font-semibold text-accent-ink">Work in progress</strong>{" "}
        — Virasat is still being built. Some items don’t have pictures yet, and
        some details may be wrong. New things are added all the time.
      </p>

      <PageHeader
        className="mt-10"
        devanagari="हमारे बारे में"
        title="About Virasat"
        subtitle="India’s everyday design, collected in one place."
      />

      <section aria-labelledby="why" className="mt-14">
        <h2 id="why" className={h2}>
          Why I made this
        </h2>
        <div className={`mt-4 space-y-4 ${body}`}>
          <p>
            Virasat is a passion project. It started when I found{" "}
            <a
              href="https://ciggies.app"
              target="_blank"
              rel="noopener noreferrer"
              className={textLink}
            >
              ciggies.app
            </a>{" "}
            — a beautiful online museum of cigarette packs — and thought: India
            has a whole world like this, and nobody has put it together.
          </p>
          <p>
            The Parle-G girl. Hand-painted shop signs. Matchbox labels with
            tigers, gods and bicycles. Film posters painted by hand. Lambrettas,
            Ambassadors and Chetaks. A tin of Dalda in every kitchen.
          </p>
          <p>
            Most of it is scattered across old newspapers, family cupboards and
            forgotten corners of the internet. Some of it is already gone.
            Virasat brings it together in one place, so it isn’t lost.
          </p>
        </div>
      </section>

      <section aria-labelledby="who" className="mt-14">
        <h2 id="who" className={h2}>
          Who it’s for
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className={card}>
            <h3 className="text-base font-semibold leading-snug text-ink">
              If you grew up with these things
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Come and see them again. Show your parents. Ask them what they
              remember.
            </p>
          </article>
          <article className={card}>
            <h3 className="text-base font-semibold leading-snug text-ink">
              If you’re a designer
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              This is a goldmine. More than a hundred years of real Indian
              lettering, colours, mascots and layouts, all in one place. That’s
              why there’s an{" "}
              <Link href="/inspo" className={textLink}>
                Inspo board
              </Link>
              : pick what you like and build a moodboard for your next project.
            </p>
          </article>
          <article className={card}>
            <h3 className="text-base font-semibold leading-snug text-ink">
              If you just love old things
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              <Link href="/" className={textLink}>
                Open the canvas
              </Link>
              , drag around and get lost.
            </p>
          </article>
        </div>
      </section>

      <section id="help" aria-labelledby="help-heading" className="mt-14 scroll-mt-24">
        <h2 id="help-heading" className={h2}>
          Help build the archive
        </h2>
        <div className={`mt-4 ${body}`}>
          <p>Virasat gets better with every picture. Any help is welcome:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-accent">
            <li>
              Photos or scans of old ads, packets, tins, labels, posters,
              signboards or tickets
            </li>
            <li>Better pictures of things already here</li>
            <li>Corrections — a wrong year, a wrong name, a missing story</li>
            <li>Ideas for things that should be in the archive</li>
          </ul>
          <p className="mt-4">
            Please send only pictures you took yourself or that are free to use,
            and tell me where they came from. If you want, I’ll credit you by
            name.
          </p>
        </div>
      </section>

      {(hasContact || issuesUrl) && (
        <section aria-labelledby="contact" className="mt-14">
          <h2 id="contact" className={h2}>
            Get in touch
          </h2>
          {hasContact && (
            <div className="mt-5 flex flex-wrap gap-3">
              {emailUser && emailDomain && (
                <EmailLink
                  user={emailUser}
                  domain={emailDomain}
                  subject="Virasat — contribution"
                  className={pill.secondary}
                >
                  Email
                </EmailLink>
              )}
              {githubProfile && (
                <a
                  href={githubProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={pill.secondary}
                >
                  GitHub
                </a>
              )}
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={pill.secondary}
                >
                  Instagram
                </a>
              )}
            </div>
          )}
          {issuesUrl && (
            <p className="mt-4 text-sm text-ink-2">
              Found a mistake?{" "}
              <a
                href={issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={textLink}
              >
                Open an issue on GitHub
              </a>
              .
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="support" className="mt-14">
        <h2 id="support" className={h2}>
          Support
        </h2>
        <p className={`mt-4 ${body}`}>
          Virasat is free and has no ads. If you like it, you can help me keep
          building it.
        </p>
        <Link href="/support" className={`${pill.primary} mt-5`}>
          Support Virasat
        </Link>
      </section>

      <p className="mt-16 border-t border-black/5 pt-6 text-sm text-ink-2">
        <Link href="/credits" className={textLink}>
          Image credits
        </Link>
      </p>
    </main>
  );
}
