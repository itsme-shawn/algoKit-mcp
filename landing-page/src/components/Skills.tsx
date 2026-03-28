import { useState, useCallback } from 'react'
import { useReveal } from '../hooks/useReveal'
import SectionHeader from './SectionHeader'
import Terminal, { Prompt, Cmd, Dim } from './Terminal'

interface SkillData {
  name: string
  shortDesc: string
  detail: string[]
  usage: string
  usageTitle: string
}

const skills: SkillData[] = [
  {
    name: 'algo:search',
    shortDesc: '문제 검색',
    detail: [
      '난이도, 태그, 키워드로 백준/프로그래머스 문제를 검색합니다.',
      'BOJ: 티어(브론즈~루비), 태그(dp, graph 등), 정렬 옵션 지원',
      '프로그래머스: 레벨(1~5), 인기순/최신순 정렬 지원',
      '플랫폼 키워드가 없으면 어떤 플랫폼인지 되묻습니다.',
      '검색 후 /algo:hint, /algo:review 등 후속 스킬 연계 제안',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:search 골드 DP 문제 추천해줘',
  },
  {
    name: 'algo:fetch',
    shortDesc: '문제 본문 스크래핑',
    detail: [
      '문제 전문(설명, 입출력 형식, 예제, 제한 조건)을 가져옵니다.',
      'URL 입력 시 플랫폼 자동 판별, 숫자만 입력 시 플랫폼 확인 후 진행',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:fetch <문제번호>',
  },
  {
    name: 'algo:hint',
    shortDesc: '단계별 힌트',
    detail: [
      '문제를 분석하고 사용자 상황에 맞는 1개 레벨의 힌트만 제공합니다.',
      'Level 1: 처음 막혔을 때 — 알고리즘명 없이 구조적 특징만 암시',
      'Level 2: "더 알려줘" 요청 — 알고리즘 유형 + 핵심 아이디어',
      'Level 3: "정답 알려줘" 요청 — 단계별 전략 + 의사코드 수준 설명',
      '한 번에 모든 힌트를 보여주지 않고, 대화를 통해 점진적으로 안내',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:hint <문제번호>',
  },
  {
    name: 'algo:blank',
    shortDesc: '빈칸 연습 코드',
    detail: [
      '완성된 풀이 코드의 핵심 로직을 ____ 로 가린 연습 파일을 생성합니다.',
      '빈칸 대상: 점화식, 자료구조 초기화, 핵심 조건문, 방문 처리 등',
      '// TODO N: 설명 주석으로 무엇을 채워야 하는지 안내 (정답은 미제공)',
      'import, 클래스 시그니처, main 블록은 그대로 유지',
      '원본 파일은 수정하지 않고 _blank 접미사 파일을 새로 생성',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:blank @<파일명>',
  },
  {
    name: 'algo:code-review',
    shortDesc: '코드 분석/피드백',
    detail: [
      '풀이 코드의 정확성, 시간/공간 복잡도를 분석하고 개선점을 제안합니다.',
      'full (기본): 정확성 + 복잡도 + 개선점 + 스타일',
      'debug: 에러 원인, 로직 오류, 엣지 케이스',
      'hint: 핵심 개념, 접근 방향',
      'review: 스타일, 가독성, 네이밍, 구조',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:code-review @<파일명>',
  },
  {
    name: 'algo:review',
    shortDesc: '복습 문서 생성',
    detail: [
      '풀이를 마친 후 학습 내용을 정리하는 마크다운 복습 문서(_REVIEW.md)를 생성합니다.',
      'MCP 서버가 템플릿과 가이드 프롬프트를 제공, AI가 대화하며 작성',
      '포함: 문제 요약, 사고흐름, 핵심아이디어, 풀이 코드 + 로직 설명',
      '포함: 데이터 흐름 추적, 실수 포인트, 관련 문제',
      '사용자 코드 기반 맞춤형 분석',
    ],
    usageTitle: 'Claude Code',
    usage: '/algo:review <문제번호>',
  },
]

export default function Skills() {
  const [active, setActive] = useState(0)
  const revealRef = useReveal()

  const handleClick = useCallback((idx: number) => setActive(idx), [])

  const skill = skills[active]

  return (
    <>
      <hr className="border-0 border-t border-border-subtle m-0" />
      <section id="skills" className="py-24 max-[720px]:py-16">
        <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
          <SectionHeader
            label="Skills"
            title="6개의 스킬"
            desc={<>자연어로 질문해도 AI가 맥락을 파악하여 Skill을 자동 호출합니다.<br />Skill을 사용하면 의도가 더 명확해져 정확한 응답을 받을 수 있습니다.</>}
          />

          <div ref={revealRef} className="reveal">
            {/* Skill tabs — vertical list on left, detail on right */}
            <div className="grid grid-cols-[200px_1fr] gap-0 border border-border-subtle rounded-sm overflow-hidden max-[720px]:grid-cols-1">

              {/* Left: skill list */}
              <div className="bg-bg-raised border-r border-border-subtle max-[720px]:border-r-0 max-[720px]:border-b">
                {skills.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => handleClick(i)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left cursor-pointer transition-all duration-150 border-b border-border-subtle last:border-b-0 ${
                      i === active
                        ? 'bg-bg-primary text-accent'
                        : 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-bg-primary/50'
                    }`}
                  >
                    <span className="font-mono text-[12px] font-medium">{s.name}</span>
                  </button>
                ))}
              </div>

              {/* Right: skill detail */}
              <div className="bg-bg-primary p-6 max-[720px]:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[14px] font-semibold text-accent">{skill.name}</span>
                  <span className="text-[12px] text-text-muted">{skill.shortDesc}</span>
                </div>

                <ul className="space-y-1.5 mb-6">
                  {skill.detail.map((line, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-text-secondary leading-[1.7]">
                      <span className="text-border-medium shrink-0 mt-0.5">-</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <p className="font-mono text-[11px] text-text-muted mb-2">사용법</p>
                <Terminal title={skill.usageTitle}>
                  <Prompt>/</Prompt><Cmd>{skill.usage.slice(1)}</Cmd>
                </Terminal>

                <p className="text-[11px] text-text-muted mt-3">
                  <Dim>자연어로도 동일하게 동작합니다.</Dim>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
