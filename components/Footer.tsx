import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";

// Premium multi-column directory footer. Server component (no hooks) so it can
// live directly in the root layout.

type FooterLink = { label: string; href: string };

// "THE CLUB" column. Real routes where they exist; "#" placeholders for pages
// that aren't built yet. (The old "Contact" link is now the Contact block.)
const CLUB_LINKS: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Fan Zone", href: "/fans-zone" },
  { label: "Events", href: "/events" },
];

// "RESOURCES" column.
const RESOURCE_LINKS: FooterLink[] = [
  { label: "Fan Store", href: "/shop" },
  { label: "Journal and News", href: "/news" },
];

const linkClass =
  "transition-colors hover:text-gold-600 dark:hover:text-gold-400";

function LinkColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <nav className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {heading}
      </h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Sleek contact block — gold icons, muted-but-readable text. Phone is a
// WhatsApp deep link, email a mailto; the location is plain text.
function ContactBlock() {
  return (
    <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        Contact
      </h3>
      <a
        href="https://wa.me/8801891653112"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 ${linkClass}`}
      >
        <Phone className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
        +880 1891653112
      </a>
      <a
        href="mailto:contact@twsbd.page"
        className={`flex items-center gap-2.5 ${linkClass}`}
      >
        <Mail className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
        contact@twsbd.page
      </a>
      <p className="flex items-center gap-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
        Chattogram, Bangladesh
      </p>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gold-500/15 bg-slate-50 text-slate-500 dark:bg-midnight-950 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Directory grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {/* Source PNG is white: invert it to dark on the light surface,
                  keep it white in dark mode — readable on either background. */}
              <Image
                src="/twsbd-logo.png"
                alt="The Whites Bangladesh"
                width={40}
                height={40}
                className="h-10 w-10 object-contain invert dark:invert-0"
              />
              <span className="font-display text-lg font-extrabold leading-none tracking-tight">
                <span className="text-slate-900 dark:text-white">
                  The Whites
                </span>{" "}
                <span className="text-gradient-gold">Bangladesh</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Uniting the pure passion of Bangladesh&rsquo;s Madridistas.
            </p>
            <p className="font-display text-sm font-semibold italic text-midnight-700 dark:text-gold-400">
              ¡Hala Madrid y nada más!
            </p>
            <SocialLinks />
          </div>

          {/* THE CLUB + Contact */}
          <div className="space-y-8">
            <LinkColumn heading="The Club" links={CLUB_LINKS} />
            <ContactBlock />
          </div>

          {/* RESOURCES */}
          <LinkColumn heading="Resources" links={RESOURCE_LINKS} />

          {/* ESTD ON */}
          <div className="space-y-2 md:text-right">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Estd On
            </h3>
            <p className="text-gradient-gold font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
              2021
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs dark:border-white/10 sm:flex-row">
          <p>© {year} The Whites Bangladesh. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy" className={linkClass}>
              Privacy
            </Link>
            <Link href="/terms" className={linkClass}>
              Terms
            </Link>
            <span>
              Built by{" "}
              <a
                href="https://arhodaditya.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 transition-colors hover:text-gold-500 dark:text-slate-300"
              >
                Aditya Sen Gupta
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
