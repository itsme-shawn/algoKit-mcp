import { useState, useCallback } from 'react'
import { useReveal } from '../hooks/useReveal'
import SectionHeader from './SectionHeader'

interface FaqItem {
  q: string
  a: React.ReactNode
}

const faqs: FaqItem[] = [
  {
    q: 'MCP가 뭔가요?',
    a: (
      <>
        <p className="mb-3">
          MCP(Model Context Protocol)는 AI 에이전트가 외부 도구를 호출할 수 있게 해주는 표준 프로토콜입니다.
          AlgoKit은 <strong className="text-text-primary">로컬 MCP 서버</strong>로 동작합니다.
          npx로 설치하면 사용자의 로컬 머신에서 실행되며, 별도의 원격 서버나 계정이 필요 없습니다.
        </p>
        <pre className="font-mono text-[12px] leading-[1.7] text-text-muted bg-bg-terminal p-3 rounded-sm border border-border-subtle whitespace-pre mb-3 overflow-x-auto">{`사용자 → AI 에이전트 → AlgoKit MCP 서버 (로컬) → solved.ac API / 웹 스크래핑
              ↓
      자연어 응답 생성`}</pre>
        <p>사용자는 MCP를 직접 다룰 필요 없이, AI에게 자연어로 요청하면 됩니다.</p>
      </>
    ),
  },
  {
    q: 'API 키가 필요한가요?',
    a: '아니요. AlgoKit은 사용 중인 AI 에이전트(Claude Code, Codex, Gemini 등)를 그대로 활용하는 MCP 서버이므로, 별도의 API 키나 로그인 없이 바로 사용할 수 있습니다.',
  },
  {
    q: '어떤 AI 에이전트를 지원하나요?',
    a: (
      <table className="text-[13px] leading-[1.7] w-full">
        <tbody>
          <tr className="border-b border-border-subtle">
            <td className="py-1.5 pr-4 text-text-primary font-medium">Claude Code</td>
            <td className="py-1.5 text-text-secondary">Plugin Marketplace (자동 설치)</td>
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-1.5 pr-4 text-text-primary font-medium">Codex</td>
            <td className="py-1.5 text-text-secondary">설치 스크립트 제공</td>
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-1.5 pr-4 text-text-primary font-medium">Gemini CLI</td>
            <td className="py-1.5 text-text-secondary">설치 스크립트 제공</td>
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-text-primary font-medium">기타 MCP 호환 에이전트</td>
            <td className="py-1.5 text-text-secondary">수동 설정 가능</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    q: 'Skill과 MCP 도구의 차이가 뭔가요?',
    a: (
      <>
        <ul className="space-y-1.5 mb-3">
          <li><strong className="text-text-primary">MCP 도구</strong>: AlgoKit 서버가 제공하는 개별 기능 단위 (예: search_problems_boj, analyze_problem_boj)</li>
          <li><strong className="text-text-primary">Skill</strong> (/algo:*): 여러 MCP 도구를 조합해 하나의 워크플로우로 묶은 것 (예: /algo:hint는 내부적으로 analyze_problem + fetch_problem_content를 조합)</li>
        </ul>
        <p>Skill을 사용하면 AI가 최적의 도구를 자동으로 선택하고 조합합니다. 자연어로 질문해도 동일한 결과를 얻을 수 있지만, Skill을 명시하면 의도가 더 정확하게 전달됩니다.</p>
      </>
    ),
  },
  {
    q: '프로그래머스도 지원하나요?',
    a: '네. 프로그래머스도 지원합니다.',
  },
  {
    q: '오프라인에서도 사용할 수 있나요?',
    a: '아니요. AlgoKit은 solved.ac API와 BOJ/프로그래머스 웹사이트에서 실시간으로 데이터를 가져오므로 인터넷 연결이 필요합니다. 단, 한 번 조회한 데이터는 30일간 캐싱되어 동일 문제 재조회 시 빠르게 응답합니다.',
  },
  {
    q: 'ChatGPT나 Claude에 직접 물어보는 것과 뭐가 다른가요?',
    a: (
      <>
        <p className="mb-3">
          AI에게 직접 알고리즘 문제를 질문하면 학습 데이터에 의존하기 때문에, 문제 정보가 부정확하거나 존재하지 않는 문제를 지어내는 경우가 있습니다.
          AlgoKit은 <strong className="text-text-primary">공식 데이터 소스</strong>(solved.ac API, BOJ/프로그래머스 웹사이트)에서 직접 실시간 데이터를 가져와 AI에게 전달하므로, 항상 정확한 문제 정보를 기반으로 응답합니다.
        </p>
        <table className="text-[12px] leading-[1.7] w-full">
          <thead>
            <tr className="border-b border-border-medium">
              <th className="py-1.5 pr-4 text-left text-text-muted font-normal" />
              <th className="py-1.5 pr-4 text-left text-text-muted font-normal">AI에 직접 질문</th>
              <th className="py-1.5 text-left text-text-muted font-normal">AlgoKit 사용</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="py-1.5 pr-4 text-text-muted">데이터 소스</td>
              <td className="py-1.5 pr-4 text-text-secondary">학습 데이터 또는 비공식 출처</td>
              <td className="py-1.5 text-text-primary">solved.ac API, 공식 사이트</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-1.5 pr-4 text-text-muted">문제 정보</td>
              <td className="py-1.5 pr-4 text-text-secondary">부정확 / 존재하지 않는 문제 생성 가능</td>
              <td className="py-1.5 text-text-primary">실시간 크롤링 (항상 최신, 정확)</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-1.5 pr-4 text-text-muted">난이도/태그</td>
              <td className="py-1.5 pr-4 text-text-secondary">부정확하거나 누락</td>
              <td className="py-1.5 text-text-primary">solved.ac 기준 정확한 데이터</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-1.5 pr-4 text-text-muted">힌트 제공</td>
              <td className="py-1.5 pr-4 text-text-secondary">한 번에 전체 풀이 노출 위험</td>
              <td className="py-1.5 text-text-primary">Level 1→2→3 단계별 제공</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-1.5 pr-4 text-text-muted">복습 지원</td>
              <td className="py-1.5 pr-4 text-text-secondary">매번 수동 요청</td>
              <td className="py-1.5 text-text-primary">구조화된 복습 문서 자동 생성</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-text-muted">학습 워크플로우</td>
              <td className="py-1.5 pr-4 text-text-secondary">없음</td>
              <td className="py-1.5 text-text-primary">검색→힌트→빈칸→리뷰→복습</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
]

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(prev => !prev), [])

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-4 px-5 text-left cursor-pointer hover:bg-bg-raised/50 transition-colors duration-150"
      >
        <span className="text-[14px] font-medium text-text-primary pr-4">{item.q}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-[13px] text-text-secondary leading-[1.8] animate-[fadeSlideIn_0.2s_ease-out]">
          {typeof item.a === 'string' ? <p>{item.a}</p> : item.a}
        </div>
      )}
    </div>
  )
}

export default function Faq() {
  const revealRef = useReveal()

  return (
    <>
      <hr className="border-0 border-t border-border-subtle m-0" />
      <section id="faq" className="py-24 max-[720px]:py-16">
        <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
          <SectionHeader
            label="Q&A"
            title="자주 묻는 질문"
            desc=""
          />

          <div ref={revealRef} className="reveal border border-border-subtle rounded-sm overflow-hidden">
            {faqs.map((item, i) => (
              <FaqAccordion key={i} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
