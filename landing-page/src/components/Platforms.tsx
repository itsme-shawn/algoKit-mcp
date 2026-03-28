import { useReveal } from '../hooks/useReveal'
import SectionHeader from './SectionHeader'

interface PlatformTool {
  name: string
  desc: string
}

interface Platform {
  name: string
  sub: string
  tools: PlatformTool[]
}

const platforms: Platform[] = [
  {
    name: '백준 온라인 저지',
    sub: 'BOJ \u2014 8개 도구',
    tools: [
      { name: 'search_problems', desc: '문제 검색' },
      { name: 'get_problem', desc: '문제 상세 조회' },
      { name: 'search_tags', desc: '태그 검색' },
      { name: 'analyze_problem', desc: '문제 분석' },
      { name: 'generate_hint', desc: '힌트 생성' },
      { name: 'generate_review_template', desc: '복습 문서' },
      { name: 'fetch_problem_content', desc: '본문 크롤링' },
      { name: 'analyze_code_submission', desc: '코드 분석' },
    ],
  },
  {
    name: '프로그래머스',
    sub: 'Programmers \u2014 7개 도구',
    tools: [
      { name: 'search_problems', desc: '문제 검색' },
      { name: 'get_problem', desc: '문제 상세 조회' },
      { name: 'analyze_problem', desc: '문제 분석' },
      { name: 'generate_hint', desc: '힌트 생성' },
      { name: 'generate_review_template', desc: '복습 문서' },
      { name: 'fetch_problem_content', desc: '본문 크롤링' },
      { name: 'analyze_code_submission', desc: '코드 분석' },
    ],
  },
]

export default function Platforms() {
  const gridRef = useReveal()

  return (
    <>
      <hr className="border-0 border-t border-border-subtle m-0" />
      <section id="platforms" className="py-24 max-[720px]:py-16">
        <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
          <SectionHeader
            label="Platforms"
            title="지원 플랫폼"
            desc="두 플랫폼의 문제를 자연어로 검색하고 분석합니다."
          />

          <div
            ref={gridRef}
            className="reveal grid grid-cols-2 gap-8 max-[720px]:grid-cols-1"
          >
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="p-8 border border-border-subtle rounded-sm bg-bg-raised"
              >
                <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                <p className="font-mono text-xs text-text-muted mb-4">{platform.sub}</p>
                <ul className="list-none text-[13px] text-text-secondary">
                  {platform.tools.map((tool) => (
                    <li
                      key={tool.name}
                      className="py-1 border-b border-border-subtle last:border-b-0"
                    >
                      <span className="font-mono text-text-primary text-xs">{tool.name}</span>{' '}
                      {tool.desc}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
