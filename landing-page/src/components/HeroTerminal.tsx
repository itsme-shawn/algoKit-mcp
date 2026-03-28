import { useState, useEffect, useCallback } from 'react'

const USER_TEXT = 'BOJ에서 실버상위~골드 난이도 DP 문제 찾아줘'
const TYPING_SPEED = 45 // ms per char
const AGENT_DELAY = 600 // ms after typing finishes

const agentLines = [
  { type: 'skill', text: 'Skill(algo:search)' },
  { type: 'dim', text: 'algokit - search_problems_boj (tags: "dp", level_min: "8", level_max: "15")' },
  { type: 'blank' },
  { type: 'highlight', text: '총 1,909개 DP 문제 (Silver III ~ Gold I)' },
  { type: 'blank' },
  { type: 'table-start' },
  { type: 'row', num: '1463', name: '1로 만들기', count: '87,355명' },
  { type: 'row', num: '9095', name: '1, 2, 3 더하기', count: '72,673명' },
  { type: 'row', num: '11726', name: '2xn 타일링', count: '65,411명' },
  { type: 'row', num: '2579', name: '계단 오르기', count: '64,700명' },
  { type: 'row', num: '14501', name: '퇴사', count: '42,532명' },
  { type: 'table-end' },
]

function Cursor() {
  return (
    <span className="inline-block w-[2px] h-[14px] bg-accent ml-[1px] align-middle animate-[blink_1s_step-end_infinite]" />
  )
}

function ResultTable({ rows }: { rows: Array<{ num: string; name: string; count: string }> }) {
  return (
    <table className="border-collapse text-[13px] leading-[1.65]">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border-subtle first:border-t-0">
            <td className="pr-4 py-0.5 text-accent whitespace-nowrap">{r.num}</td>
            <td className="pr-4 py-0.5 text-text-primary whitespace-nowrap">{r.name}</td>
            <td className="py-0.5 text-text-muted text-right whitespace-nowrap">{r.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AgentLine({ line, allLines, index }: { line: typeof agentLines[number]; allLines: typeof agentLines; index: number }) {
  if (line.type === 'blank') return <div className="h-3" />
  if (line.type === 'table-start') {
    const rows: Array<{ num: string; name: string; count: string }> = []
    for (let i = index + 1; i < allLines.length; i++) {
      const l = allLines[i]
      if (l.type === 'table-end') break
      if (l.type === 'row') rows.push(l as { type: string; num: string; name: string; count: string })
    }
    return <ResultTable rows={rows} />
  }
  if (line.type === 'row' || line.type === 'table-end') return null
  if (line.type === 'skill') {
    return (
      <div className="text-text-muted">
        Skill(<span className="text-accent">{line.text!.match(/\((.+)\)/)?.[1]}</span>)
      </div>
    )
  }
  if (line.type === 'highlight') {
    const parts = line.text!.match(/^(총 )([\d,]+)(개.+)$/)
    if (parts) {
      return (
        <div className="text-text-secondary">
          {parts[1]}<span className="text-accent">{parts[2]}</span>{parts[3]}
        </div>
      )
    }
  }
  return <div className="text-text-muted">{line.text}</div>
}

export default function HeroTerminal() {
  const [typedLen, setTypedLen] = useState(0)
  const [showAgent, setShowAgent] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'typing' | 'waiting' | 'revealing' | 'done'>('idle')

  // Start animation when component mounts
  useEffect(() => {
    const startDelay = setTimeout(() => setPhase('typing'), 800)
    return () => clearTimeout(startDelay)
  }, [])

  // Typing phase
  useEffect(() => {
    if (phase !== 'typing') return
    if (typedLen >= USER_TEXT.length) {
      setPhase('waiting')
      return
    }
    const id = setTimeout(() => setTypedLen(prev => prev + 1), TYPING_SPEED)
    return () => clearTimeout(id)
  }, [phase, typedLen])

  // Waiting phase -> reveal agent
  useEffect(() => {
    if (phase !== 'waiting') return
    const id = setTimeout(() => {
      setShowAgent(true)
      setPhase('revealing')
    }, AGENT_DELAY)
    return () => clearTimeout(id)
  }, [phase])

  // Reveal agent lines one by one
  useEffect(() => {
    if (phase !== 'revealing') return
    if (visibleLines >= agentLines.length) {
      setPhase('done')
      return
    }
    const delay = visibleLines === 0 ? 100 : agentLines[visibleLines - 1].type === 'blank' ? 50 : 80
    const id = setTimeout(() => setVisibleLines(prev => prev + 1), delay)
    return () => clearTimeout(id)
  }, [phase, visibleLines])

  const replay = useCallback(() => {
    setTypedLen(0)
    setShowAgent(false)
    setVisibleLines(0)
    setPhase('idle')
    setTimeout(() => setPhase('typing'), 300)
  }, [])

  const skipToEnd = useCallback(() => {
    setTypedLen(USER_TEXT.length)
    setShowAgent(true)
    setVisibleLines(agentLines.length)
    setPhase('done')
  }, [])

  const showCursor = phase === 'typing' || phase === 'waiting'
  const isAnimating = phase !== 'done'

  return (
    <div className="bg-bg-terminal border border-border-subtle rounded-sm overflow-hidden font-mono text-[13px] leading-[1.65]">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-bg-surface border-b border-border-subtle">
        <span className="w-[10px] h-[10px] rounded-full bg-[#ec6a5e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#f4bf4f]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#61c554]" />
        <span className="text-[11px] text-text-muted ml-1.5">algokit-mcp</span>
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
        {/* User section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
          </div>
          <div className="pl-0.5 text-text-primary">
            {phase === 'idle' ? (
              <Cursor />
            ) : (
              <>
                {USER_TEXT.slice(0, typedLen)}
                {showCursor && <Cursor />}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        {showAgent && (
          <div className="border-t border-border-subtle my-3" />
        )}

        {/* Agent section */}
        {showAgent && (
          <div className="animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green bg-green/10 px-1.5 py-0.5 rounded-sm">Agent</span>
              {phase === 'revealing' && (
                <span className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-green animate-[pulse_1s_ease-in-out_infinite]" />
                  <span className="w-1 h-1 rounded-full bg-green animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                  <span className="w-1 h-1 rounded-full bg-green animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                </span>
              )}
            </div>
            <div className="pl-0.5">
              {agentLines.slice(0, visibleLines).map((line, i) => (
                <AgentLine key={i} line={line} allLines={agentLines} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
