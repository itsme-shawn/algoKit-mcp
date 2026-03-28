import { type ReactNode, useRef, useState, useCallback } from 'react'

function CopyButton({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!targetRef.current) return
    const text = targetRef.current.innerText
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [targetRef])

  return (
    <button
      onClick={handleCopy}
      className="ml-auto p-1 rounded-sm text-text-muted hover:text-text-secondary transition-colors duration-150 cursor-pointer"
      title="복사"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

interface TerminalProps {
  title: string
  children: ReactNode
  className?: string
}

export default function Terminal({ title, children, className = '' }: TerminalProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`bg-bg-terminal border border-border-subtle rounded-sm overflow-hidden font-mono text-[13px] leading-[1.65] ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-bg-surface border-b border-border-subtle">
        <span className="w-[10px] h-[10px] rounded-full bg-[#ec6a5e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#f4bf4f]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#61c554]" />
        <span className="text-[11px] text-text-muted ml-1.5">{title}</span>
        <CopyButton targetRef={bodyRef} />
      </div>
      <div ref={bodyRef} className="p-4 px-[18px] overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

/* Inline token components for terminal content */
export function Prompt({ children }: { children: ReactNode }) {
  return <span className="text-green">{children}</span>
}

export function Cmd({ children }: { children: ReactNode }) {
  return <span className="text-text-primary">{children}</span>
}

export function Comment({ children }: { children: ReactNode }) {
  return <span className="text-text-muted">{children}</span>
}

export function Result({ children }: { children: ReactNode }) {
  return <span className="text-text-secondary">{children}</span>
}

export function Highlight({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>
}

export function Kw({ children }: { children: ReactNode }) {
  return <span className="text-blue">{children}</span>
}

export function Str({ children }: { children: ReactNode }) {
  return <span className="text-green">{children}</span>
}

export function Num({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>
}

export function Fn({ children }: { children: ReactNode }) {
  return <span className="text-fn">{children}</span>
}

export function Op({ children }: { children: ReactNode }) {
  return <span className="text-text-secondary">{children}</span>
}

export function UserLabel({ children }: { children: ReactNode }) {
  return <span className="text-accent-dim">{children}</span>
}

export function AgentLabel({ children }: { children: ReactNode }) {
  return <span className="text-green">{children}</span>
}

export function Dim({ children }: { children: ReactNode }) {
  return <span className="text-text-muted">{children}</span>
}

export function TableBorder({ children }: { children: ReactNode }) {
  return <span className="text-border-medium">{children}</span>
}

export function Br() {
  return <br />
}
