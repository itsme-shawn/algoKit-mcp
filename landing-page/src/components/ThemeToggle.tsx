interface ThemeToggleProps {
  theme: 'dark' | 'light'
  onToggle: () => void
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-200 cursor-pointer"
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3.5" />
          <line x1="8" y1="1" x2="8" y2="2.5" />
          <line x1="8" y1="13.5" x2="8" y2="15" />
          <line x1="1" y1="8" x2="2.5" y2="8" />
          <line x1="13.5" y1="8" x2="15" y2="8" />
          <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" />
          <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" />
          <line x1="3.05" y1="12.95" x2="4.11" y2="11.89" />
          <line x1="11.89" y1="4.11" x2="12.95" y2="3.05" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 8.5A6.5 6.5 0 0 1 7.5 2c0-.5.05-1 .15-1.5A7 7 0 1 0 14.5 8c-.17.17-.33.33-.5.5z" />
        </svg>
      )}
    </button>
  )
}
