import { useState, useEffect, useCallback, type ReactNode } from 'react'

const TYPING_SPEED = 40
const AGENT_DELAY = 500

function Cursor() {
  return (
    <span className="inline-block w-[2px] h-[14px] bg-accent ml-[1px] align-middle animate-[blink_1s_step-end_infinite]" />
  )
}

interface Props {
  title: string
  userText: string
  agentContent: ReactNode
  className?: string
  /** Skill invocation hint shown after typing */
  skillHint?: string
  /** unique key to reset animation when tab changes */
  animKey?: string | number
  /** Called when the full animation (typing + agent reveal) is done */
  onDone?: () => void
}

export default function AnimatedTerminal({ title, userText, agentContent, className = '', skillHint, animKey, onDone }: Props) {
  const [typedLen, setTypedLen] = useState(0)
  const [showAgent, setShowAgent] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'typing' | 'waiting' | 'done'>('idle')

  // Reset on animKey change
  useEffect(() => {
    setTypedLen(0)
    setShowAgent(false)
    setPhase('idle')
    const id = setTimeout(() => setPhase('typing'), 400)
    return () => clearTimeout(id)
  }, [animKey])

  // Typing
  useEffect(() => {
    if (phase !== 'typing') return
    if (typedLen >= userText.length) {
      setPhase('waiting')
      return
    }
    const id = setTimeout(() => setTypedLen(prev => prev + 1), TYPING_SPEED)
    return () => clearTimeout(id)
  }, [phase, typedLen, userText.length])

  // Reveal agent
  useEffect(() => {
    if (phase !== 'waiting') return
    const id = setTimeout(() => {
      setShowAgent(true)
      setPhase('done')
      onDone?.()
    }, AGENT_DELAY)
    return () => clearTimeout(id)
  }, [phase, onDone])

  const replay = useCallback(() => {
    setTypedLen(0)
    setShowAgent(false)
    setPhase('idle')
    setTimeout(() => setPhase('typing'), 300)
  }, [])

  const skipToEnd = useCallback(() => {
    setTypedLen(userText.length)
    setShowAgent(true)
    setPhase('done')
    onDone?.()
  }, [userText.length, onDone])

  const showCursor = phase === 'typing' || phase === 'waiting'
  const isAnimating = phase !== 'done'

  return (
    <div className={`bg-bg-terminal border border-border-subtle rounded-sm overflow-hidden font-mono text-[13px] leading-[1.65] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-bg-surface border-b border-border-subtle">
        <span className="w-[10px] h-[10px] rounded-full bg-[#ec6a5e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#f4bf4f]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#61c554]" />
        <span className="text-[11px] text-text-muted ml-1.5">{title}</span>
        {isAnimating ? (
          <button
            onClick={skipToEnd}
            className="ml-auto flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors duration-150 cursor-pointer"
            title="애니메이션 건너뛰기"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5V19L11 12L4 5ZM13 5V19L20 12L13 5Z" />
            </svg>
            <span>Skip</span>
          </button>
        ) : (
          <button
            onClick={replay}
            className="ml-auto flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors duration-150 cursor-pointer"
            title="다시 재생"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Replay</span>
          </button>
        )}
      </div>

      <div className="p-4 px-[18px] overflow-x-auto">
        {/* User */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
          </div>
          <div className="pl-0.5 text-text-primary">
            {phase === 'idle' ? (
              <Cursor />
            ) : (
              <>
                {userText.slice(0, typedLen)}
                {showCursor && <Cursor />}
              </>
            )}
          </div>
          {skillHint && phase === 'done' && (
            <div className="mt-2 pl-0.5 text-[11px] text-text-muted animate-[fadeSlideIn_0.3s_ease-out]">
              Skill 사용 시 <span className="text-accent/70 font-mono">{skillHint}</span>
            </div>
          )}
        </div>

        {/* Divider + Agent */}
        {showAgent && (
          <>
            <div className="border-t border-border-subtle my-3" />
            <div className="animate-[fadeSlideIn_0.3s_ease-out]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green bg-green/10 px-1.5 py-0.5 rounded-sm">Agent</span>
              </div>
              <div className="pl-0.5">
                {agentContent}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
