// Facebook + Instagram links with a gold-accent, scale-on-hover treatment.
// No hooks, so it renders in both the (client) Navbar and the (server) footer.

import { FacebookIcon, InstagramIcon } from "@/components/BrandIcons";

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61558474366308",
  instagram: "https://www.instagram.com/thewhites.stories/",
} as const;

export default function SocialLinks({ className }: { className?: string }) {
  const linkClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-500 transition-all duration-300 hover:scale-110 hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-300";

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Whites Bangladesh on Facebook"
        className={linkClass}
      >
        <FacebookIcon className="h-5 w-5" />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Whites Stories on Instagram"
        className={linkClass}
      >
        <InstagramIcon className="h-5 w-5" />
      </a>
    </div>
  );
}
