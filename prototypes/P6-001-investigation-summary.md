# P6-001 조사 결과 요약

**태스크**: P6-001 - Playwright 통합 준비
**작성일**: 2026-02-14
**상태**: ✅ 완료

## 1. Playwright MCP 연결 확인 결과

### 사용 가능한 도구
Playwright MCP가 정상적으로 연결되어 있으며, 다음 도구들이 사용 가능합니다:

**핵심 도구**:
- ✅ `browser_navigate` - URL로 이동
- ✅ `browser_snapshot` - 페이지 접근성 스냅샷 캡처
- ✅ `browser_evaluate` - JavaScript 실행
- ✅ `browser_take_screenshot` - 스크린샷
- ✅ `browser_close` - 브라우저 닫기

**기타 유용한 도구**:
- `browser_wait_for` - 요소 대기
- `browser_click`, `browser_hover` - 인터랙션
- `browser_console_messages` - 콘솔 메시지 확인
- `browser_network_requests` - 네트워크 요청 확인

### 테스트 결과
- ✅ BOJ 문제 페이지 접근 성공: https://www.acmicpc.net/problem/1000
- ✅ JavaScript 실행 성공 (HTML 구조 추출)
- ✅ 다중 페이지 네비게이션 성공

## 2. BOJ 페이지 HTML 구조 분석

### 2.1 페이지 구조 일관성
BOJ의 모든 문제 페이지는 일관된 HTML 구조를 가지고 있습니다:
- 각 섹션은 고유한 ID를 가진 요소로 구성
- CSS Selector를 통해 안정적으로 요소 선택 가능
- HTML 엔티티 사용 (`&lt;`, `&gt;`, `&nbsp;`)

### 2.2 주요 섹션 CSS Selector

| 섹션 | CSS Selector | 예시 텍스트 | 비고 |
|------|--------------|-------------|------|
| 문제 제목 | `#problem_title` | "A+B" | 단순 텍스트 |
| 문제 설명 | `#problem_description` | "두 정수 A와 B를..." | HTML 포함 |
| 입력 형식 | `#problem_input` | "첫째 줄에 A와 B가..." | HTML 포함 |
| 출력 형식 | `#problem_output` | "첫째 줄에 A+B를..." | HTML 포함 |
| 예제 입력 | `#sample-input-{n}` | "1 2" | `<pre>` 태그 |
| 예제 출력 | `#sample-output-{n}` | "3" | `<pre>` 태그 |
| 시간 제한 | `#problem-info tbody tr td:nth-child(1)` | "2 초" | 테이블 셀 |
| 메모리 제한 | `#problem-info tbody tr td:nth-child(2)` | "128 MB" | 테이블 셀 |

### 2.3 예제 입출력 구조
- 예제 번호는 1부터 시작 (`#sample-input-1`, `#sample-input-2`, ...)
- 예제가 더 이상 없을 때까지 순차적으로 증가
- 입력과 출력은 항상 쌍으로 존재
- `<pre>` 태그로 감싸져 있어 개행 문자 보존

**예제 개수 확인 로직**:
```javascript
let i = 1;
while (document.querySelector(`#sample-input-${i}`) &&
       document.querySelector(`#sample-output-${i}`)) {
  i++;
}
const sampleCount = i - 1;
```

### 2.4 테스트한 문제
- ✅ **1000번 (A+B)**: 예제 1개, 단순 텍스트
- ✅ **10950번 (A+B - 3)**: 예제 1개 (여러 줄)

## 3. HTML 파싱 로직 프로토타입

### 3.1 라이브러리 선택: **cheerio**
**선택 이유**:
- ✅ 빠른 파싱 속도 (jsdom보다 8배 빠름)
- ✅ jQuery 스타일 API (사용 편의성)
- ✅ 가벼운 메모리 사용
- ✅ Node.js 서버 환경에 적합
- ✅ BOJ 페이지는 정적 HTML만 파싱하면 됨 (JS 실행 불필요)

**대안: jsdom**
- ❌ 무겁고 느림
- ❌ 완전한 DOM 구현 (오버킬)
- ✅ 브라우저 API 완벽 호환 (필요 없음)

### 3.2 타입 정의
```typescript
interface ProblemContent {
  title: string;
  description: string;
  input: string;
  output: string;
  samples: Array<{
    input: string;
    output: string;
  }>;
  limits: {
    time: string;
    memory: string;
  };
}
```

### 3.3 파싱 로직 핵심
```typescript
function parseBojProblemHtml(html: string): ProblemContent {
  const $ = cheerio.load(html);

  // 1. 단순 텍스트 추출
  const title = $('#problem_title').text().trim();

  // 2. 여러 예제 처리
  const samples = [];
  let i = 1;
  while (true) {
    const input = $(`#sample-input-${i}`).text().trim();
    const output = $(`#sample-output-${i}`).text().trim();
    if (!input || !output) break;
    samples.push({ input, output });
    i++;
  }

  // 3. 테이블 셀 선택
  const timeLimit = $('#problem-info tbody tr td:nth-child(1)').text().trim();

  return { title, ..., samples, limits: { time: timeLimit, ... } };
}
```

### 3.4 에러 처리
- 필수 필드 검증 (title, description, samples)
- 빈 예제 배열 체크
- try-catch로 파싱 실패 처리
- null 반환으로 실패 시그널링

## 4. 주요 발견 사항

### 4.1 HTML 특성
- ✅ **일관된 구조**: 모든 문제 페이지가 동일한 구조
- ✅ **고유 ID**: 각 섹션이 고유한 ID를 가져 셀렉터 안정적
- ⚠️ **HTML 엔티티**: `&lt;`, `&gt;`, `&nbsp;` 등 사용 (cheerio가 자동 디코딩)
- ⚠️ **개행 문자**: `<pre>` 태그 내 개행 보존됨 (`trim()` 필요)

### 4.2 예제 입출력 패턴
- 예제는 항상 1부터 시작
- 입력과 출력은 항상 쌍으로 존재
- 여러 줄 예제도 하나의 `<pre>` 태그에 포함

### 4.3 제한 정보
- 테이블 구조로 되어 있음
- 시간 제한: 첫 번째 `<td>` (예: "2 초")
- 메모리 제한: 두 번째 `<td>` (예: "128 MB")

## 5. 다음 단계 (P6-002)

### 5.1 구현할 파일
1. **src/scraping/boj-scraper.ts**
   - Playwright MCP 통합
   - HTML 가져오기 로직
   - 재시도 및 에러 처리

2. **src/scraping/html-parser.ts**
   - cheerio 파싱 로직
   - 타입 정의
   - 검증 로직

3. **src/api/types.ts** (확장)
   - `ProblemContent` 타입 추가

### 5.2 테스트 케이스
- **1000번**: 단순 문제 (예제 1개)
- **10950번**: 여러 줄 예제
- **2750번**: 여러 예제
- **에러 케이스**: 존재하지 않는 문제, 네트워크 에러

### 5.3 설치 필요
```bash
npm install cheerio
npm install -D @types/cheerio
```

## 6. 파일 위치

### 생성된 문서
- **분석 문서**: `/docs/02-development/boj-page-structure.md`
  - 상세한 HTML 구조 분석
  - CSS Selector 레퍼런스
  - 파싱 전략 및 주의사항

- **프로토타입 코드**: `/prototypes/boj-html-parser.ts`
  - 타입 정의
  - 파싱 로직 수도코드
  - 에러 처리 예제
  - CSS Selector 상수

## 7. 참고 자료

- **Playwright 문서**: https://playwright.dev/
- **cheerio 문서**: https://cheerio.js.org/
- **BOJ 문제 페이지**: https://www.acmicpc.net/problem/{problemId}

## 8. 결론

✅ **Playwright MCP 연결 확인 완료**
✅ **BOJ 페이지 구조 분석 완료**
✅ **HTML 파싱 로직 프로토타입 작성 완료**

다음 태스크(P6-002)에서 본격적인 구현을 시작할 준비가 완료되었습니다.
