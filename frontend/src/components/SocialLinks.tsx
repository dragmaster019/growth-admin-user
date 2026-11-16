import type { ReactNode } from 'react'
import { SOCIAL_LINKS } from '../lib/site'

type SocialItem = {
  label: string
  description: string
  href: string
  accent: string
  icon: ReactNode
}

const socials: SocialItem[] = [
  {
    label: 'Instagram',
    description: 'Campus stories, drops and behind the scenes.',
    href: SOCIAL_LINKS.instagram,
    accent: 'hover:border-magenta/50 hover:text-magenta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    description: 'The professional side of the Growth network.',
    href: SOCIAL_LINKS.linkedin,
    accent: 'hover:border-neon/50 hover:text-neon',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7.5 10.5V17M7.5 7.5h.01M11.5 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M11.5 10.5V17" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    description: 'Code, builds and the work behind Growth.',
    href: SOCIAL_LINKS.github,
    accent: 'hover:border-white/40 hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-2.5 1-2.5 4.5-1.5 6C2.5 9 2 10 2 11.5c0 3.5 2.5 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    description: 'Quick questions? Message the team directly.',
    href: SOCIAL_LINKS.whatsapp,
    accent: 'hover:border-lime/50 hover:text-lime',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
        <path d="M9 8.5c.3-.7.7-.7 1-.6l.8 1.6c.1.3 0 .5-.2.7l-.5.6c.5 1.1 1.4 2 2.5 2.5l.6-.5c.2-.2.4-.3.7-.2l1.6.8c.1.3.1.7-.6 1-1.2.5-3.8-.4-5.2-1.8-1.4-1.4-2.3-4-1.8-5.2Z" />
      </svg>
    ),
  },
]

export default function SocialLinks({ variant = 'icons' }: { variant?: 'icons' | 'cards' }) {
  if (variant === 'cards') {
    return (
      <div className="space-y-2.5">
        {socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            className={`group flex items-center gap-4 rounded-2xl border border-edge bg-panel2/40 p-4 text-slate-300 transition duration-300 hover:-translate-y-0.5 ${social.accent}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-edge bg-panel/80">
              {social.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">{social.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{social.description}</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={social.label}
          title={social.label}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-edge bg-panel2/50 text-slate-400 transition duration-300 hover:-translate-y-0.5 ${social.accent}`}
        >
          {social.icon}
        </a>
      ))}
    </div>
  )
}
