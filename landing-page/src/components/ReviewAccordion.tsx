export default function ReviewAccordion() {
  return (
    <div className="mt-4 border border-border-subtle rounded-sm bg-bg-primary overflow-hidden">
      {/* Editor header — file tab style */}
      <div className="flex items-center bg-bg-raised border-b border-border-subtle">
        <div className="flex items-center gap-1.5 px-4 py-2 bg-bg-primary border-r border-border-subtle">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-muted">
            <rect x="2" y="2" width="12" height="12" rx="1" />
            <path d="M5 6h6M5 8.5h4" />
          </svg>
          <span className="font-mono text-[11px] text-text-primary">11726_REVIEW.md</span>
        </div>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-text-muted px-3">Preview</span>
      </div>

      {/* Markdown preview body */}
      <div className="max-h-[600px] overflow-y-auto px-6 py-5 text-[13px] leading-[1.85] text-text-secondary">

        {/* Title */}
        <h2 className="text-[18px] font-bold text-text-primary mb-1 leading-tight">BOJ 11726 — 2×n 타일링</h2>
        <p className="text-text-muted text-[12px] mb-6">https://www.acmicpc.net/problem/11726</p>

        <hr className="border-border-subtle my-5" />

        {/* 문제 정보 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">문제 정보</h3>
        <p className="mb-2"><span className="text-text-muted">핵심 요구사항:</span> 2×n 직사각형을 1×2, 2×1 타일로 채우는 방법의 수를 10,007로 나눈 나머지 출력</p>
        <p className="mb-1"><span className="text-text-muted">제약 조건:</span></p>
        <ul className="list-disc list-inside mb-2 text-[12px] space-y-0.5 pl-2">
          <li>입력 크기: 1 ≤ n ≤ 1,000</li>
          <li>시간 제한: 1초</li>
          <li>메모리 제한: 256MB</li>
        </ul>
        <p className="mb-1"><span className="text-text-muted">메타데이터:</span></p>
        <ul className="list-disc list-inside mb-2 text-[12px] space-y-0.5 pl-2">
          <li>티어: Silver III</li>
          <li>태그: 다이나믹 프로그래밍</li>
          <li>해결자 수: 65,411명</li>
          <li>평균 시도: 2.7회</li>
        </ul>

        <hr className="border-border-subtle my-5" />

        {/* 사고흐름 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">사고흐름</h3>
        <p><span className="text-text-muted">첫 인상:</span> n이 작아질수록 경우의 수가 줄어드는 구조 → 작은 문제로 분할 가능</p>
        <p><span className="text-text-muted">자료구조/알고리즘 선택:</span> DP (Bottom-Up)</p>
        <p><span className="text-text-muted">선택 근거:</span> dp[n]을 구하기 위해 이전 상태(dp[n-1], dp[n-2])만 필요 → 점화식 도출 가능</p>
        <p><span className="text-text-muted">특이 조건 처리:</span> 모듈러 연산을 매 단계 적용하여 오버플로우 방지</p>
        <p className="mb-0"><span className="text-text-muted">시간 복잡도 검증:</span> O(n) = O(1000) → 충분</p>

        <hr className="border-border-subtle my-5" />

        {/* 핵심아이디어 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">핵심아이디어</h3>
        <p className="mb-2">
          2×n 타일링의 마지막 열 배치를 기준으로 경우를 나누면 피보나치 점화식이 도출된다.
          마지막에 세로 타일(1×2) 1개를 놓으면 dp[n-1], 가로 타일(2×1) 2개를 놓으면 dp[n-2]가 되어
        </p>
        <p className="font-mono text-accent text-[13px]">dp[n] = dp[n-1] + dp[n-2]</p>

        <hr className="border-border-subtle my-5" />

        {/* 풀이 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">풀이</h3>

        <h4 className="text-[13px] font-semibold text-text-primary mb-2">풀이 1 (내 코드)</h4>
        <pre className="font-mono text-[12px] leading-[1.7] text-text-primary bg-bg-terminal p-3 rounded-sm border border-border-subtle whitespace-pre mb-3 overflow-x-auto">{`import sys

read = sys.stdin.readline

n = int(read())
dp = [0] * (1001)

dp[1], dp[2] = 1, 2
for i in range(3, n + 1):
    dp[i] = (dp[i - 1] + dp[i - 2]) % 10007
print(dp[n])`}</pre>

        <p className="text-[12px] font-semibold text-text-primary mb-1">핵심 포인트</p>
        <ul className="list-disc list-inside text-[12px] space-y-0.5 pl-2 mb-4">
          <li>배열을 1001 크기로 고정하여 n=1일 때 dp[2] 초기화 시 IndexError 방지</li>
          <li>매 단계에서 % 10007 적용하여 중간 값 오버플로우 방지</li>
        </ul>

        <h4 className="text-[13px] font-semibold text-text-primary mb-2">로직 설명</h4>
        <p className="text-[12px] text-text-muted mb-1">점화식 적용부</p>
        <pre className="font-mono text-[12px] leading-[1.7] text-text-primary bg-bg-terminal p-3 rounded-sm border border-border-subtle whitespace-pre mb-3 overflow-x-auto">{`for i in range(3, n + 1):
    dp[i] = (dp[i - 1] + dp[i - 2]) % 10007`}</pre>
        <p className="text-[12px] mb-1">마지막 열 기준 배치:</p>
        <ul className="list-disc list-inside text-[12px] space-y-0.5 pl-2 mb-3">
          <li>세로 타일 1개 → 나머지 2×(n-1) 영역: dp[n-1]가지</li>
          <li>가로 타일 2개 → 나머지 2×(n-2) 영역: dp[n-2]가지</li>
        </ul>

        <p className="text-[12px] text-text-muted mb-1">입력 예시로 데이터 흐름 추적:</p>
        <pre className="font-mono text-[12px] leading-[1.7] text-text-primary bg-bg-terminal p-3 rounded-sm border border-border-subtle whitespace-pre mb-3 overflow-x-auto">{`입력: n = 9
dp[1] = 1
dp[2] = 2
dp[3] = dp[2] + dp[1] = 3
dp[4] = dp[3] + dp[2] = 5
dp[5] = dp[4] + dp[3] = 8
dp[6] = dp[5] + dp[4] = 13
dp[7] = dp[6] + dp[5] = 21
dp[8] = dp[7] + dp[6] = 34
dp[9] = dp[8] + dp[7] = 55
출력: 55`}</pre>

        <h4 className="text-[13px] font-semibold text-text-primary mb-2">풀이 2 (공간 최적화)</h4>
        <pre className="font-mono text-[12px] leading-[1.7] text-text-primary bg-bg-terminal p-3 rounded-sm border border-border-subtle whitespace-pre mb-3 overflow-x-auto">{`import sys

read = sys.stdin.readline

n = int(read())

if n == 1:
    print(1)
else:
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, (a + b) % 10007
    print(b)`}</pre>
        <p className="text-[12px] mb-0">
          이전 두 값만 사용하므로 변수 2개로 O(1) 공간 달성.
          n ≤ 1000이라 실익은 거의 없지만, 타일링 문제의 공간 최적화 패턴으로 알아두면 유용.
        </p>

        <hr className="border-border-subtle my-5" />

        {/* 실수 포인트 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">자주 하는 실수/오해 포인트</h3>
        <ul className="list-disc list-inside text-[12px] space-y-0.5 pl-2 mb-0">
          <li>n=1일 때 배열 크기 부족으로 IndexError</li>
          <li>모듈러 연산을 마지막에만 적용 → 중간 값 오버플로우 (Python은 괜찮지만 C++/Java에서 문제)</li>
          <li>dp[0] 초기값 설정 혼동 (0 vs 1)</li>
        </ul>

        <hr className="border-border-subtle my-5" />

        {/* 관련 문제 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">관련 문제 목록</h3>
        <ul className="list-disc list-inside text-[12px] space-y-0.5 pl-2 mb-0">
          <li><span className="text-text-primary">11727. 2×n 타일링 2</span> — 2×2 타일 추가</li>
          <li><span className="text-text-primary">1010. 다리 놓기 (Silver V)</span> — 조합 + DP</li>
          <li><span className="text-text-primary">9625. BABBA (Silver V)</span> — 피보나치 변형</li>
        </ul>

        <hr className="border-border-subtle my-5" />

        {/* 정리 요약 */}
        <h3 className="text-[14px] font-bold text-text-primary mb-3">정리 요약</h3>
        <p className="mb-3">
          2×n 타일링은 마지막 열 배치로 경우를 나누면 피보나치 점화식 dp[n] = dp[n-1] + dp[n-2]가 도출되는 기본 DP 문제.
          모듈러 연산의 매 단계 적용과 초기값 설정(dp[1]=1, dp[2]=2)이 포인트.
        </p>
        <p className="text-text-muted text-[12px]">
          <span className="text-text-secondary font-medium">핵심 키워드:</span> DP, 피보나치, 타일링, 모듈러 연산
        </p>
      </div>
    </div>
  )
}
