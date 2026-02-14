/**
 * BOJ 문제 페이지 HTML 파싱 프로토타입
 *
 * Phase 6 - P6-001: Playwright 통합 준비
 *
 * 이 파일은 프로토타입으로, 실제 구현은 P6-002에서 진행됩니다.
 * cheerio 라이브러리를 사용하여 BOJ 문제 페이지를 파싱합니다.
 */

// NOTE: 실제 사용 시 cheerio 설치 필요
// npm install cheerio
// npm install -D @types/cheerio

// import * as cheerio from 'cheerio';

/**
 * 파싱된 문제 콘텐츠
 */
interface ProblemContent {
  /** 문제 제목 */
  title: string;
  /** 문제 설명 (HTML 태그 제거된 텍스트) */
  description: string;
  /** 입력 형식 */
  input: string;
  /** 출력 형식 */
  output: string;
  /** 예제 입출력 목록 */
  samples: Array<{
    input: string;
    output: string;
  }>;
  /** 시간/메모리 제한 */
  limits: {
    time: string;
    memory: string;
  };
}

/**
 * BOJ 문제 페이지 HTML을 파싱하여 구조화된 데이터로 변환
 *
 * @param html - BOJ 문제 페이지의 HTML 문자열
 * @returns 파싱된 문제 콘텐츠
 * @throws 파싱 실패 시 에러
 *
 * @example
 * ```typescript
 * const html = await fetchBojProblem(1000);
 * const content = parseBojProblemHtml(html);
 * console.log(content.title); // "A+B"
 * console.log(content.samples[0].input); // "1 2"
 * ```
 */
function parseBojProblemHtml(html: string): ProblemContent {
  // NOTE: 실제 구현에서는 cheerio 사용
  // const $ = cheerio.load(html);

  // 아래는 프로토타입 수도코드입니다
  const $ = (selector: string) => ({
    text: () => '',
    trim: () => ''
  });

  // 1. 문제 제목 추출
  const title = $('#problem_title').text().trim();

  // 2. 문제 설명 추출 (HTML 태그 제거)
  const description = $('#problem_description').text().trim();

  // 3. 입력 형식 추출
  const input = $('#problem_input').text().trim();

  // 4. 출력 형식 추출
  const output = $('#problem_output').text().trim();

  // 5. 예제 입출력 추출
  const samples: Array<{ input: string; output: string }> = [];
  let i = 1;
  while (true) {
    const sampleInput = $(`#sample-input-${i}`).text().trim();
    const sampleOutput = $(`#sample-output-${i}`).text().trim();

    // 더 이상 예제가 없으면 종료
    if (!sampleInput || !sampleOutput) break;

    samples.push({
      input: sampleInput,
      output: sampleOutput,
    });
    i++;
  }

  // 6. 시간/메모리 제한 추출
  const timeLimit = $('#problem-info tbody tr td:nth-child(1)').text().trim();
  const memoryLimit = $('#problem-info tbody tr td:nth-child(2)').text().trim();

  return {
    title,
    description,
    input,
    output,
    samples,
    limits: {
      time: timeLimit,
      memory: memoryLimit,
    },
  };
}

/**
 * 안전한 파싱 함수 (에러 처리 포함)
 *
 * @param html - BOJ 문제 페이지의 HTML 문자열
 * @returns 파싱 성공 시 문제 콘텐츠, 실패 시 null
 *
 * @example
 * ```typescript
 * const content = parseBojProblemHtmlSafe(html);
 * if (content) {
 *   console.log(content.title);
 * } else {
 *   console.error('파싱 실패');
 * }
 * ```
 */
function parseBojProblemHtmlSafe(html: string): ProblemContent | null {
  try {
    const result = parseBojProblemHtml(html);

    // 필수 필드 검증
    if (!result.title) {
      console.error('Missing title in parsed content');
      return null;
    }

    if (!result.description) {
      console.error('Missing description in parsed content');
      return null;
    }

    if (result.samples.length === 0) {
      console.error('No samples found in parsed content');
      return null;
    }

    // 제한 정보 검증
    if (!result.limits.time || !result.limits.memory) {
      console.error('Missing limits information in parsed content');
      return null;
    }

    return result;
  } catch (error) {
    console.error('Failed to parse BOJ problem HTML:', error);
    return null;
  }
}

/**
 * HTML 엔티티를 일반 텍스트로 변환
 * (cheerio는 자동으로 처리하지만, 참고용으로 작성)
 *
 * @param text - HTML 엔티티가 포함된 텍스트
 * @returns 디코딩된 텍스트
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

// Export (실제 구현에서 사용)
export type { ProblemContent };
export { parseBojProblemHtml, parseBojProblemHtmlSafe, decodeHtmlEntities };

// ============================================================================
// 테스트용 예제 (실제 테스트는 vitest로 작성)
// ============================================================================

/**
 * 프로토타입 테스트 예제
 *
 * 실제 테스트는 P6-002에서 vitest로 작성됩니다.
 */
function exampleUsage() {
  // 예제 HTML (1000번 문제 일부)
  const exampleHtml = `
    <div id="problem_title">A+B</div>
    <div id="problem_description">
      <p>두 정수 A와 B를 입력받은 다음,&nbsp;A+B를 출력하는 프로그램을 작성하시오.</p>
    </div>
    <div id="problem_input">
      <p>첫째 줄에 A와 B가 주어진다. (0 &lt; A, B &lt; 10)</p>
    </div>
    <div id="problem_output">
      <p>첫째 줄에 A+B를 출력한다.</p>
    </div>
    <pre id="sample-input-1">1 2
</pre>
    <pre id="sample-output-1">3
</pre>
    <table id="problem-info">
      <tbody>
        <tr>
          <td>2 초 </td>
          <td>128 MB</td>
        </tr>
      </tbody>
    </table>
  `;

  // 파싱 실행
  const content = parseBojProblemHtmlSafe(exampleHtml);

  if (content) {
    console.log('Title:', content.title);
    console.log('Description:', content.description);
    console.log('Input:', content.input);
    console.log('Output:', content.output);
    console.log('Samples:', content.samples);
    console.log('Limits:', content.limits);
  }
}

// ============================================================================
// 주요 CSS Selector 레퍼런스
// ============================================================================

/**
 * BOJ 문제 페이지의 주요 CSS Selector 목록
 *
 * 실제 구현 시 참고용으로 사용
 */
const BOJ_SELECTORS = {
  /** 문제 제목 */
  title: '#problem_title',

  /** 문제 설명 */
  description: '#problem_description',

  /** 입력 형식 */
  input: '#problem_input',

  /** 출력 형식 */
  output: '#problem_output',

  /** 예제 입력 (n은 1부터 시작) */
  sampleInput: (n: number) => `#sample-input-${n}`,

  /** 예제 출력 (n은 1부터 시작) */
  sampleOutput: (n: number) => `#sample-output-${n}`,

  /** 시간 제한 */
  timeLimit: '#problem-info tbody tr td:nth-child(1)',

  /** 메모리 제한 */
  memoryLimit: '#problem-info tbody tr td:nth-child(2)',
} as const;

export { BOJ_SELECTORS };
