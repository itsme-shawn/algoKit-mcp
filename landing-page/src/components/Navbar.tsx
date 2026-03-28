import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const navLinks = [
  { href: '#workflow', label: '워크플로우' },
  { href: '#skills', label: '스킬' },
  { href: '#install', label: '설치' },
  { href: '#faq', label: 'Q&A' },
]

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nav-bg backdrop-blur-[12px] border-b border-border-subtle">
      <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5 h-[52px] flex items-center">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 hover:no-underline shrink-0">
          <img src="/favicon.svg" alt="" width="24" height="24" />
          <span className="font-display text-[13px] font-semibold tracking-[-0.02em] leading-none text-text-primary">
            Algo<span className="text-accent">Kit</span>
          </span>
        </a>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav links */}
        <div className="flex items-center gap-1 max-[720px]:hidden">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-[12px] leading-none text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-sm hover:bg-bg-raised hover:no-underline transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-border-subtle mx-3 max-[720px]:hidden" />

        {/* GitHub + Theme toggle */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/itsme-shawn/AlgoKit-mcp"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 text-[12px] leading-none text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-sm border border-border-subtle hover:border-border-medium hover:no-underline transition-all duration-150 max-[720px]:hidden"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  )
}
