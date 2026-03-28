import { useState, useEffect, useCallback } from 'react'
import { useReveal } from '../hooks/useReveal'
import HeroTerminal from './HeroTerminal'

const agents = [
  { name: 'Claude Code', icon: '/claude-favicon.png' },
  { name: 'Codex', icon: '/codex-favicon.png' },
  { name: 'Gemini CLI', icon: '/gemini-favicon.png' },
]

function RotatingAgent() {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  const cycle = useCallback(() => {
    setPhase('out')
    setTimeout(() => {
      setIndex(prev => (prev + 1) % agents.length)
      setPhase('in')
    }, 300)
  }, [])

  useEffect(() => {
    const id = setInterval(cycle, 2000)
    return () => clearInterval(id)
  }, [cycle])

  const agent = agents[index]

  return (
    <span
      className="text-accent font-medium transition-[opacity,transform] duration-300 ease-in-out"
      style={{
        opacity: phase === 'in' ? 1 : 0,
        transform: phase === 'in' ? 'translateY(0)' : 'translateY(8px)',
        display: 'inline',
      }}
    >
      <img src={agent.icon} alt="" width="18" height="18" className="rounded-[3px] inline" style={{ verticalAlign: '-3px', marginRight: '5px' }} />
      {agent.name}
    </span>
  )
}

export default function Hero() {
  const termRef = useReveal()

  return (
    <header className="pt-[140px] pb-24 max-[720px]:pt-[110px] max-[720px]:pb-16">
      <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
        <p className="font-mono text-xs text-accent tracking-[0.08em] uppercase mb-4">
          MCP Server for Algorithm Study
        </p>
        <h1 className="font-body text-[clamp(28px,5vw,44px)] font-bold leading-[1.2] tracking-[-0.03em] text-text-primary mb-8 max-w-[600px] max-[480px]:text-[26px]">
          코딩테스트,<br />AI와 함께 준비하다
        </h1>
        <p className="text-base text-text-secondary max-w-[580px] mb-3 leading-[1.8]">
          <RotatingAgent /> 와 함께<br />
          문제 탐색부터 힌트, 코드 리뷰, 복습까지 하나의 흐름으로.
        </p>
        <p className="font-mono text-[12px] text-text-muted tracking-[0.04em] mb-10">
          AI-Powered MCP + Skills Toolkit
        </p>
        <div className="flex gap-4 items-center flex-wrap max-[480px]:flex-col max-[480px]:items-start">
          <a
            href="#install"
            className="inline-block font-mono text-[13px] font-medium px-6 py-2.5 bg-accent text-bg-primary rounded-sm hover:bg-btn-primary-hover hover:no-underline transition-colors duration-200"
          >
            설치하기
          </a>
          <a
            href="https://github.com/itsme-shawn/AlgoKit-mcp"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 font-mono text-[13px] text-text-secondary px-5 py-2.5 border border-border-medium rounded-sm hover:border-text-muted hover:text-text-primary hover:no-underline transition-[border-color,color] duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Supported platforms */}
        <div className="mt-10 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider">Platforms</span>
          <a href="https://www.acmicpc.net" target="_blank" rel="noopener" className="flex items-center gap-1.5 px-2.5 py-1 border border-border-subtle rounded-sm hover:border-border-medium hover:no-underline transition-colors duration-150">
            <img src="/boj-favicon.png" alt="BOJ" width="16" height="16" className="rounded-[2px]" />
            <span className="text-[12px] text-text-secondary">백준</span>
          </a>
          <a href="https://programmers.co.kr" target="_blank" rel="noopener" className="flex items-center gap-1.5 px-2.5 py-1 border border-border-subtle rounded-sm hover:border-border-medium hover:no-underline transition-colors duration-150">
            <img src="/programmers-favicon.png" alt="Programmers" width="16" height="16" className="rounded-[2px]" />
            <span className="text-[12px] text-text-secondary">프로그래머스</span>
          </a>
        </div>

        <div ref={termRef} className="reveal mt-10">
          <HeroTerminal />
        </div>
      </div>
    </header>
  )
}
