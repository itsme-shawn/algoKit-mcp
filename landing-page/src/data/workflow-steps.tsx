import type { ReactNode } from 'react'
import {
  Dim, Highlight, Op, Result, Num,
  Br, Comment, Str, Fn, Kw,
} from '../components/Terminal'

export interface WorkflowStep {
  label: string
  icon: string
  meta: string
  terminalTitle: string
  userText: string
  skillHint?: string
  agentContent: ReactNode
}

/* ── Reusable table component ── */
function ResultTable({ rows }: { rows: Array<{ num: string; name: string; count: string }> }) {
  return (
    <table className="border-collapse text-[13px] leading-[1.65] my-1">
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

function InfoTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <table className="border-collapse text-[13px] leading-[1.65] my-1">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border-subtle first:border-t-0">
            <td className="pr-6 py-0.5 text-text-muted whitespace-nowrap">{r.label}</td>
            <td className="py-0.5 text-text-secondary whitespace-nowrap">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TodoTable({ rows }: { rows: Array<{ num: string; hint: string }> }) {
  return (
    <table className="border-collapse text-[13px] leading-[1.65] my-1">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border-subtle first:border-t-0">
            <td className="pr-4 py-0.5 text-accent whitespace-nowrap">{r.num}</td>
            <td className="py-0.5 text-text-secondary">{r.hint}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const workflowSteps: WorkflowStep[] = [
  /* ────────── 1. 검색 ────────── */
  {
    label: '문제 탐색',
    icon: '01',
    meta: 'algo:search \u2014 난이도, 태그, 키워드로 문제 탐색',
    terminalTitle: 'algo:search',
    userText: 'BOJ에서 실버상위~골드 난이도 DP 문제 찾아줘',
    skillHint: '/algo:search BOJ에서 실버상위~골드 난이도 DP 문제 찾아줘',
    agentContent: (
      <>
        <Dim>Skill(<Highlight>algo:search</Highlight>)</Dim>
        <Br />
        <Dim>{'  \u23BF  Successfully loaded skill'}</Dim>
        <Br /><Br />
        <Dim>BOJ에서 실버 상위~골드 난이도 DP 문제를 검색하겠습니다.</Dim>
        <Br /><Br />
        <Dim>algokit - search_problems_boj <Str>(MCP)</Str></Dim>
        <Br />
        <Dim>{'  (tags: "dp", level_min: "8", level_max: "15", sort: "level", direction: "asc")'}</Dim>
        <Br /><Br />
        <Result>총 <Highlight>1,909</Highlight>개의 DP 문제가 Silver III ~ Gold I 범위에 있습니다.</Result>
        <Br /><Br />
        <Dim>Silver III (실버 3)</Dim>
        <Br />
        <ResultTable rows={[
          { num: '1463', name: '1로 만들기', count: '87,355명' },
          { num: '9095', name: '1, 2, 3 더하기', count: '72,673명' },
          { num: '11726', name: '2×n 타일링', count: '65,411명' },
          { num: '2579', name: '계단 오르기', count: '64,700명' },
          { num: '14501', name: '퇴사', count: '42,532명' },
        ]} />
        <Br />
        <Result>다음 페이지에서 Silver II ~ Gold 난이도 문제도 볼까요?</Result>
      </>
    ),
  },

  /* ────────── 2. 문제 요약 ────────── */
  {
    label: '요약',
    icon: '02',
    meta: 'algo:fetch \u2014 문제 본문 스크래핑 및 요약',
    terminalTitle: 'algo:fetch',
    userText: 'BOJ 11726 문제 내용 요약해줘',
    skillHint: '/algo:fetch 11726',
    agentContent: (
      <>
        <Dim>algokit - fetch_problem_content_boj <Str>(MCP)</Str>(problem_id: 11726)</Dim>
        <Br /><Br />
        <Result>BOJ 11726 - <Highlight>2×n 타일링</Highlight></Result>
        <Br /><Br />
        <Result>2×n 크기의 직사각형을 1×2, 2×1 타일로 빈틈없이 채우는 방법의 수를</Result>
        <Br />
        <Result>구하는 문제입니다.</Result>
        <Br />
        <InfoTable rows={[
          { label: '입력', value: '정수 n (1 \u2264 n \u2264 1,000)' },
          { label: '출력', value: '방법의 수를 10,007로 나눈 나머지' },
          { label: '시간/메모리', value: '1초 / 256MB' },
        ]} />
        <Br />
        <Result>{'예제: n=2 \u2192 2, n=9 \u2192 55'}</Result>
      </>
    ),
  },

  /* ────────── 3. 단계별 힌트 (Level 1 → 2 → 3 통합) ────────── */
  {
    label: '단계별 힌트',
    icon: '03',
    meta: 'algo:hint \u2014 사용자 상황에 따라 Level 1~3 단계적 제공',
    terminalTitle: 'algo:hint',
    userText: '이 문제, 접근에 대한 힌트를 줘',
    skillHint: '/algo:hint 11726',
    agentContent: (
      <>
        <Dim>algokit - analyze_problem_boj <Str>(MCP)</Str>(problem_id: 11726)</Dim>
        <Br /><Br />
        <Result>BOJ 11726 — <Highlight>2×n 타일링</Highlight> (Silver III)</Result>
        <Br /><Br />

        {/* Level 1 */}
        <Highlight>Level 1 힌트: 문제 분석</Highlight>
        <Br /><Br />
        <Result>작은 경우부터 직접 그려보세요. n=1, n=2, n=3, n=4일 때 2×n 직사각형을</Result>
        <Br />
        <Result>채우는 방법이 각각 몇 가지인지 손으로 나열해 보면, 이전 결과들이 다음</Result>
        <Br />
        <Result>결과를 만드는 데 재활용되는 패턴이 보일 겁니다.</Result>
        <Br /><Br />
        <Result>{'"n번째를 채우려면 직전에 어떤 상태에서 올 수 있는가?"를 생각해 보세요.'}</Result>
        <Br /><Br />
        <Dim>---</Dim>
        <Br />
        <Dim>더 구체적인 힌트가 필요하면 말씀해 주세요!</Dim>
        <Br /><Br />

        {/* Level 2 — 사용자 추가 요청 */}
        <div className="border-t border-border-subtle my-3" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
        </div>
        <span className="text-text-primary">잘 안 풀리네. 힌트를 좀 더 줘</span>
        <Br /><Br />
        <div className="border-t border-border-subtle my-3" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green bg-green/10 px-1.5 py-0.5 rounded-sm">Agent</span>
        </div>

        <Highlight>Level 2 힌트: 핵심 아이디어</Highlight>
        <Br /><Br />
        <Result>이 문제는 <Highlight>다이나믹 프로그래밍(DP)</Highlight> 문제입니다.</Result>
        <Br /><Br />
        <Result>핵심은 2×n 직사각형의 맨 오른쪽 열을 채우는 방법이 딱 두 가지뿐이라는</Result>
        <Br />
        <Result>점입니다:</Result>
        <Br /><Br />
        <Result><Num>1.</Num> {'세로 타일 1개 (2×1) → 나머지는 2×(n-1) 채우기'}</Result>
        <Br />
        <Result><Num>2.</Num> {'가로 타일 2개 (1×2 두 개) → 나머지는 2×(n-2) 채우기'}</Result>
        <Br /><Br />
        <Result>즉, f(n)을 구하려면 f(n-1)과 f(n-2)만 알면 됩니다.</Result>
        <Br /><Br />
        <Dim>---</Dim>
        <Br />
        <Dim>더 상세한 풀이 가이드가 필요하면 말씀해 주세요.</Dim>
        <Br /><Br />

        {/* Level 3 — 사용자 추가 요청 */}
        <div className="border-t border-border-subtle my-3" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-dim bg-accent/10 px-1.5 py-0.5 rounded-sm">User</span>
        </div>
        <span className="text-text-primary">정답 수준의 풀이를 알려줘</span>
        <Br /><Br />
        <div className="border-t border-border-subtle my-3" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green bg-green/10 px-1.5 py-0.5 rounded-sm">Agent</span>
        </div>

        <Highlight>Level 3 힌트: 단계별 풀이 전략</Highlight>
        <Br /><Br />
        <Result><Num>1.</Num> dp 배열을 n+1 크기로 초기화</Result>
        <Br />
        <Result><Num>2.</Num> 기저 조건: dp[1] = 1, dp[2] = 2</Result>
        <Br />
        <Result><Num>3.</Num> {'점화식: dp[i] = (dp[i-1] + dp[i-2]) % 10007'}</Result>
        <Br />
        <Result><Num>4.</Num> dp[n] 출력</Result>
        <Br /><Br />
        <Dim>의사코드:</Dim>
        <Br />
        <Comment>{'  n = input()'}</Comment>
        <Br />
        <Comment>{'  dp[1] = 1, dp[2] = 2'}</Comment>
        <Br />
        <Comment>{'  for i in 3..n: dp[i] = (dp[i-1] + dp[i-2]) % 10007'}</Comment>
        <Br />
        <Comment>{'  print(dp[n])'}</Comment>
      </>
    ),
  },

  /* ────────── 4. 빈칸 힌트 ────────── */
  {
    label: '빈칸 힌트',
    icon: '04',
    meta: 'algo:blank \u2014 핵심 로직을 빈칸으로 변환',
    terminalTitle: '11726_blank.py',
    userText: '정답 코드에 빈 칸을 뚫어서 힌트를 줘',
    skillHint: '/algo:blank @11726.py',
    agentContent: (
      <>
        <Dim>algokit - fetch_problem_content_boj <Str>(MCP)</Str>(problem_id: 11726)</Dim>
        <Br /><Br />
        <Dim>Write(11726_blank.py)</Dim>
        <Br />
        <Dim>{'  \u23BF  Wrote 26 lines to 11726_blank.py'}</Dim>
        <Br /><Br />
        <Comment># BOJ 11726 - 2×n 타일링</Comment>
        <Br />
        <Comment># https://www.acmicpc.net/problem/11726</Comment>
        <Br />
        <Comment>#</Comment>
        <Br />
        <Comment>{`# 점화식 힌트:`}</Comment>
        <Br />
        <Comment>{`#   - 맨 오른쪽에 세로 타일 1개 \u2192 f(n-1)`}</Comment>
        <Br />
        <Comment>{`#   - 맨 오른쪽에 가로 타일 2개 \u2192 f(n-2)`}</Comment>
        <Br /><Br />
        <Kw>n</Kw> <Op>=</Op> <Fn>int</Fn><Op>(</Op><Fn>input</Fn><Op>())</Op>
        <Br /><Br />
        <Comment># TODO 1: dp 배열 초기화 (크기: n+1, 초깃값: 0)</Comment>
        <Br />
        <Kw>dp</Kw> <Op>=</Op> <Highlight>____</Highlight>
        <Br /><Br />
        <Comment># TODO 2: 기저 조건 설정</Comment>
        <Br />
        <Kw>dp[<Num>1</Num>]</Kw> <Op>=</Op> <Highlight>____</Highlight>
        <Br />
        <Kw>dp[<Num>2</Num>]</Kw> <Op>=</Op> <Highlight>____</Highlight>
        <Br /><Br />
        <Comment># TODO 3: 점화식을 이용해 dp[3] ~ dp[n] 채우기</Comment>
        <Br />
        <Kw>for</Kw> <Kw>i</Kw> <Kw>in</Kw> <Fn>range</Fn><Op>(</Op><Num>3</Num><Op>,</Op> <Kw>n</Kw> <Op>+</Op> <Num>1</Num><Op>):</Op>
        <Br />
        <Kw>{'    dp[i]'}</Kw> <Op>=</Op> <Highlight>____</Highlight>
        <Br /><Br />
        <Comment># TODO 4: 결과 출력 (10007로 나눈 나머지)</Comment>
        <Br />
        <Fn>print</Fn><Op>(</Op><Highlight>____</Highlight><Op>)</Op>
        <Br /><Br />
        <Dim>11726_blank.py에 빈칸 버전을 작성했습니다. 총 4개의 TODO가 있습니다:</Dim>
        <Br />
        <TodoTable rows={[
          { num: 'TODO 1', hint: 'dp 배열을 어떤 크기로, 어떻게 초기화할지' },
          { num: 'TODO 2', hint: 'dp[1]과 dp[2]의 기저값 (직접 손으로 세어보세요)' },
          { num: 'TODO 3', hint: 'dp[i] = ? \u2014 Level 2 힌트에서 알려드린 점화식!' },
          { num: 'TODO 4', hint: '최종 출력 시 모듈러 연산을 어디서 적용할지' },
        ]} />
        <Br />
        <Result>빈칸을 ____ 부분에 채워보세요. 막히면 말씀해 주세요!</Result>
      </>
    ),
  },

  /* ────────── 6. 코드 리뷰 ────────── */
  {
    label: '코드 리뷰',
    icon: '05',
    meta: 'algo:code-review \u2014 정확성, 복잡도, 개선점 분석',
    terminalTitle: 'algo:code-review',
    userText: '내 풀이를 보고 리뷰해줘',
    skillHint: '/algo:code-review @11726.py',
    agentContent: (
      <>
        <Dim>Skill(<Highlight>algo:code-review</Highlight>)</Dim>
        <Br />
        <Dim>{'  \u23BF  Successfully loaded skill'}</Dim>
        <Br /><Br />
        <Dim>algokit - analyze_code_submission_boj <Str>(MCP)</Str></Dim>
        <Br />
        <Dim>{'  (problem_id: 11726, language: "python", analysis_type: "review")'}</Dim>
        <Br /><Br />
        <Result>BOJ 11726 - 2×n 타일링 코드 리뷰</Result>
        <Br /><Br />
        <Str>{'\u2705 정확성'}</Str>
        <Br /><Br />
        <Result>피보나치 점화식 dp[i] = dp[i-1] + dp[i-2]를 정확히 적용했고,</Result>
        <Br />
        <Result>모듈러 연산도 올바르게 처리했습니다. 정답 코드입니다.</Result>
        <Br /><Br />
        <Str>{'\u23F1\uFE0F  복잡도'}</Str>
        <Br /><Br />
        <Result>- 시간: O(n) — 최적</Result>
        <Br />
        <Result>- 공간: O(n) (고정 1001 크기 배열)</Result>
        <Br /><Br />
        <Highlight>개선 포인트</Highlight>
        <Br /><Br />
        <Result><Num>1.</Num> 배열 크기 고정 (1001)</Result>
        <Br />
        <Result>{'  n + 1 크기로 잡는 게 의도가 더 명확합니다.'}</Result>
        <Br /><Br />
        <Result><Num>2.</Num> 공간 최적화 가능</Result>
        <Br />
        <Result>{'  이전 두 값만 사용하므로 변수 두 개로 줄일 수 있습니다:'}</Result>
        <Br />
        <Comment>{'  a, b = 1, 2'}</Comment>
        <Br />
        <Comment>{'  for _ in range(3, n + 1):'}</Comment>
        <Br />
        <Comment>{'      a, b = b, (a + b) % 10007'}</Comment>
        <Br /><Br />
        <Dim>총평</Dim>
        <Br /><Br />
        <Result>DP 기본 문제를 깔끔하게 풀었습니다. 점화식 도출, 모듈러 처리,</Result>
        <Br />
        <Result>입력 최적화 모두 잘 적용되어 수정할 부분이 거의 없는 코드입니다.</Result>
      </>
    ),
  },

  /* ────────── 7. 복습 정리 ────────── */
  {
    label: '복습 정리',
    icon: '06',
    meta: 'algo:review \u2014 복습 마크다운 문서 자동 생성',
    terminalTitle: 'REVIEW.md',
    userText: '복습 문서 만들어줘',
    skillHint: '/algo:review 11726',
    agentContent: (
      <>
        <Dim>Skill(<Highlight>algo:review</Highlight>)</Dim>
        <Br />
        <Dim>{'  \u23BF  Successfully loaded skill'}</Dim>
        <Br /><Br />
        <Dim>algokit - generate_review_template_boj <Str>(MCP)</Str></Dim>
        <Br />
        <Dim>{'  (problem_id: 11726, user_notes: "피보나치 점화식 dp[i] = dp[i-1] +'}</Dim>
        <Br />
        <Dim>{'  dp[i-2] 활용, 모듈러 연산 10007, O(n) 시간/공간")'}</Dim>
        <Br /><Br />
        <Dim>Write(BOJ/10000~/11726/11726_REVIEW.md)</Dim>
        <Br />
        <Dim>{'  \u23BF  Wrote 142 lines to BOJ/10000~/11726/11726_REVIEW.md'}</Dim>
        <Br /><Br />
        <Result>BOJ/10000~/11726/11726_REVIEW.md 파일을 생성했습니다.</Result>
        <Br /><Br />
        <Result>주요 내용:</Result>
        <Br />
        <Result>{'- 핵심아이디어: 마지막 열 배치 기준 경우 분리 \u2192 피보나치 점화식'}</Result>
        <Br />
        <Result>- 데이터 흐름 추적: n=9 예시로 단계별 dp 값 변화</Result>
        <Br />
        <Result>- 공간 최적화 풀이: 변수 2개로 O(1) 공간 버전 추가</Result>
        <Br />
        <Result>- 실수 포인트: n=1 IndexError, 모듈러 타이밍, dp[0] 초기값 혼동</Result>
        <Br />
        <Result>- 관련 문제: 11727 (타일링 2), 1010 (다리 놓기), 9625 (BABBA)</Result>
      </>
    ),
  },
]
