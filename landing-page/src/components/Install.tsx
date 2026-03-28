import { useState, useCallback } from 'react'
import { useReveal } from '../hooks/useReveal'
import SectionHeader from './SectionHeader'
import Terminal, {
  Prompt, Cmd, Str, Br,
} from './Terminal'

const tabs = [
  { label: 'Claude Code', icon: '/claude-favicon.png' },
  { label: 'Codex', icon: '/codex-favicon.png' },
  { label: 'Gemini CLI', icon: '/gemini-favicon.png' },
  { label: '수동 설치', icon: null },
]

function ClaudeCodePanel() {
  return (
    <div className="pt-8">
      <p className="text-sm text-text-secondary mb-6 leading-[1.7]">
        Claude Code Plugin Marketplace 를 사용해 설치할 수 있습니다.
      </p>

      <p className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Step 1 — 마켓플레이스 추가</p>
      <Terminal title="Claude Code" className="mb-5">
        <Prompt>/plugin</Prompt> <Cmd>marketplace add itsme-shawn/AlgoKit-mcp</Cmd>
      </Terminal>

      <p className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Step 2 — 플러그인 설치</p>
      <Terminal title="Claude Code" className="mb-5">
        <Prompt>/plugin</Prompt> <Cmd>install algokit-mcp@algokit-plugin</Cmd>
      </Terminal>

      <p className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Step 3 — 플러그인 리로드</p>
      <Terminal title="Claude Code" className="mb-8">
        <Prompt>/reload-plugins</Prompt>
      </Terminal>

      <p className="text-sm text-text-secondary mb-4 leading-[1.7]">
        또는 자연어로 요청할 수도 있습니다.
      </p>
      <Terminal title="Claude Code" className="mb-8">
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
        </div>
        <Cmd>algokit-mcp 플러그인을 마켓플레이스에서 설치해줘</Cmd>
      </Terminal>

      <p className="text-sm text-text-secondary mb-4 leading-[1.7]">
        MCP 서버만 직접 추가하려면:
      </p>
      <Terminal title="Terminal">
        <Prompt>$</Prompt> <Cmd>claude mcp add --scope user algokit -- npx -y algokit-mcp@latest</Cmd>
      </Terminal>
    </div>
  )
}

function CodexPanel() {
  return (
    <div className="pt-8">
      <p className="text-sm text-text-secondary mb-4 leading-[1.7]">
        Codex에게 아래 내용을 전달하세요.
      </p>
      <Terminal title="Codex">
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
        </div>
        <Cmd>이 지시사항 대로 설치해줘 :</Cmd>
        <Br />
        <Str>https://raw.githubusercontent.com/itsme-shawn/AlgoKit-mcp/refs/heads/master/.codex/INSTALL.md</Str>
      </Terminal>
    </div>
  )
}

function GeminiPanel() {
  return (
    <div className="pt-8">
      <p className="text-sm text-text-secondary mb-4 leading-[1.7]">
        Gemini CLI에게 아래 내용을 전달하세요.
      </p>
      <Terminal title="Gemini CLI">
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
        </div>
        <Cmd>이 지시사항 대로 설치해줘 :</Cmd>
        <Br />
        <Str>https://raw.githubusercontent.com/itsme-shawn/AlgoKit-mcp/refs/heads/master/.gemini/INSTALL.md</Str>
      </Terminal>
    </div>
  )
}

function ManualPanel() {
  return (
    <div className="pt-8">
      <p className="text-sm text-text-secondary mb-4 leading-[1.7]">
        각 도구의 설정 파일에 직접 MCP 서버를 등록합니다.
      </p>

      <div className="mt-8">
        <p className="mb-4">
          <strong className="text-text-primary">Claude Code</strong>{' '}
          <span className="text-xs text-text-muted italic">~/.claude.json</span>
        </p>
        <Terminal title="~/.claude.json" className="mb-4">
          <pre className="whitespace-pre m-0 font-mono text-[13px] leading-[1.65]">{`{\n  "mcpServers": {\n    "algokit": {\n      "command": "npx",\n      "args": ["-y", "algokit-mcp@latest"]\n    }\n  }\n}`}</pre>
        </Terminal>
      </div>

      <div className="mt-8">
        <p className="mb-4">
          <strong className="text-text-primary">Codex</strong>{' '}
          <span className="text-xs text-text-muted italic">~/.codex/config.toml</span>
        </p>
        <Terminal title="~/.codex/config.toml" className="mb-4">
          <pre className="whitespace-pre m-0 font-mono text-[13px] leading-[1.65]">{`[mcp.servers.algokit]\ncommand = "npx"\nargs = ["-y", "algokit-mcp@latest"]`}</pre>
        </Terminal>
      </div>

      <div className="mt-8">
        <p className="mb-4">
          <strong className="text-text-primary">Gemini CLI</strong>{' '}
          <span className="text-xs text-text-muted italic">~/.gemini/settings.json</span>
        </p>
        <Terminal title="~/.gemini/settings.json">
          <pre className="whitespace-pre m-0 font-mono text-[13px] leading-[1.65]">{`{\n  "mcpServers": {\n    "algokit": {\n      "command": "npx",\n      "args": ["-y", "algokit-mcp@latest"]\n    }\n  }\n}`}</pre>
        </Terminal>
      </div>
    </div>
  )
}

const panels = [ClaudeCodePanel, CodexPanel, GeminiPanel, ManualPanel]

export default function Install() {
  const [active, setActive] = useState(0)
  const revealRef = useReveal()

  const handleTab = useCallback((idx: number) => {
    setActive(idx)
  }, [])

  const PanelComponent = panels[active]

  return (
    <>
      <hr className="border-0 border-t border-border-subtle m-0" />
      <section id="install" className="py-24 max-[720px]:py-16">
        <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
          <SectionHeader
            label="Install"
            title="설치 가이드"
            desc="사용 중인 AI 코딩 도구에 맞는 방법을 선택하세요."
          />

          <div ref={revealRef} className="reveal">
            <nav className="flex gap-0 border-b border-border-subtle" role="tablist">
              {tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => handleTab(i)}
                  className={`flex items-center gap-1.5 font-mono text-xs py-2.5 px-[18px] border-b-2 cursor-pointer transition-colors duration-150 ${
                    i === active
                      ? 'text-accent border-accent'
                      : 'text-text-muted border-transparent hover:text-text-secondary'
                  }`}
                >
                  {tab.icon && <img src={tab.icon} alt="" width="14" height="14" className="rounded-[2px]" />}
                  {tab.label}
                </button>
              ))}
            </nav>

            <PanelComponent />
          </div>
        </div>
      </section>
    </>
  )
}
