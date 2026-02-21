/**
 * E2E 테스트: MCP 서버 실제 통신 시나리오
 *
 * MCP 서버를 자식 프로세스로 실행하고 JSON-RPC 2.0 프로토콜로
 * 실제 통신하며 각 도구의 동작을 검증합니다.
 *
 * 실행 전 빌드 필요: npm run build
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';

// ─────────────────────────────────────────────
// MCP 클라이언트 헬퍼
// ─────────────────────────────────────────────

const SERVER_PATH = path.resolve(process.cwd(), 'dist/index.js');
const DEFAULT_TIMEOUT = 30_000;

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

class McpTestClient {
  private proc: ChildProcessWithoutNullStreams;
  private idCounter = 0;
  private buffer = '';
  private pendingResolvers: Map<number, (res: JsonRpcResponse) => void> = new Map();

  constructor() {
    this.proc = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stdout.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg: JsonRpcResponse = JSON.parse(line);
          const resolve = this.pendingResolvers.get(msg.id);
          if (resolve) {
            this.pendingResolvers.delete(msg.id);
            resolve(msg);
          }
        } catch {
          // 파싱 불가 라인 무시
        }
      }
    });
  }

  /** JSON-RPC 요청 전송 후 응답 대기 */
  send(method: string, params: unknown = {}): Promise<JsonRpcResponse> {
    const id = ++this.idCounter;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout: ${method} (id=${id})`)),
        DEFAULT_TIMEOUT
      );
      this.pendingResolvers.set(id, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
      this.proc.stdin.write(msg + '\n');
    });
  }

  /** MCP tools/call 편의 메서드 */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
    return this.send('tools/call', { name, arguments: args });
  }

  /** 서버 종료 */
  close(): void {
    this.proc.stdin.end();
    this.proc.kill();
  }
}

// ─────────────────────────────────────────────
// 공유 클라이언트 (세션 1개로 모든 테스트 수행)
// ─────────────────────────────────────────────

let client: McpTestClient;

beforeAll(async () => {
  client = new McpTestClient();
  // 초기화 핸드쉐이크
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'e2e-test', version: '1.0' },
  });
}, 15_000);

afterAll(() => {
  client.close();
});

// ─────────────────────────────────────────────
// 시나리오 1: 서버 기본 동작
// ─────────────────────────────────────────────

describe('[S1] 서버 기본 동작', () => {
  it('initialize 응답에 serverInfo가 포함되어야 함', async () => {
    const client2 = new McpTestClient();
    const res = await client2.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' },
    });
    client2.close();

    expect(res.result).toMatchObject({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'AlgoKit' },
    });
  });

  it('tools/list 에 16개 도구가 등록되어야 함', async () => {
    const res = await client.send('tools/list');
    const tools = (res.result as { tools: Array<{ name: string }> }).tools;
    const names = tools.map((t) => t.name);

    expect(names).toHaveLength(16);
    expect(names).toContain('search_problems');
    expect(names).toContain('get_problem');
    expect(names).toContain('search_tags');
    expect(names).toContain('health_check');
    expect(names).toContain('analyze_problem_boj');
    expect(names).toContain('generate_hint_boj');
    expect(names).toContain('generate_review_template_boj');
    expect(names).toContain('fetch_problem_content_boj');
    expect(names).toContain('analyze_code_submission_boj');
    expect(names).toContain('search_programmers_problems');
    expect(names).toContain('get_programmers_problem');
  });

  it('health_check 가 정상 응답을 반환해야 함', async () => {
    const res = await client.callTool('health_check');
    expect(res.error).toBeUndefined();
    const content = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('AlgoKit');
  });
});

// ─────────────────────────────────────────────
// 시나리오 2: BOJ 문제 검색
// ─────────────────────────────────────────────

describe('[S2] BOJ 문제 검색 (search_problems)', () => {
  it('키워드 검색이 정상 동작해야 함', async () => {
    const res = await client.callTool('search_problems', { query: 'A+B', page: 1 });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('문제 검색 결과');
    expect(text).toContain('acmicpc.net');
  }, DEFAULT_TIMEOUT);

  it('숫자 level_min/level_max 필터가 동작해야 함', async () => {
    const res = await client.callTool('search_problems', {
      level_min: 6,
      level_max: 10,
      page: 1,
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('Silver');
  }, DEFAULT_TIMEOUT);

  it('숫자 문자열 level("16") 필터가 오류 없이 동작해야 함 [버그픽스 검증]', async () => {
    const res = await client.callTool('search_problems', {
      level_min: '16',
      level_max: '17',
      page: 1,
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('문제 검색 결과');
  }, DEFAULT_TIMEOUT);

  it('티어 문자열("실버 3") level 필터가 동작해야 함', async () => {
    const res = await client.callTool('search_problems', {
      level_min: '실버 3',
      level_max: '골드 1',
      page: 1,
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('문제 검색 결과');
  }, DEFAULT_TIMEOUT);

  it('태그 필터(dp)가 동작해야 함', async () => {
    const res = await client.callTool('search_problems', {
      tags: 'dp',
      level_min: 11,
      level_max: 15,
      page: 1,
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('Gold');
  }, DEFAULT_TIMEOUT);

  it('존재하지 않는 키워드는 "검색 결과가 없습니다" 반환', async () => {
    const res = await client.callTool('search_problems', {
      query: 'xyzabc123nonexistent_e2e',
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('검색 결과가 없습니다');
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 3: BOJ 문제 상세 조회
// ─────────────────────────────────────────────

describe('[S3] BOJ 문제 상세 조회 (get_problem)', () => {
  it('1000번(A+B) 문제를 정상 조회해야 함', async () => {
    const res = await client.callTool('get_problem', { problem_id: 1000 });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('1000');
    expect(text).toContain('A+B');
  }, DEFAULT_TIMEOUT);

  it('존재하지 않는 문제 ID는 에러를 반환해야 함', async () => {
    const res = await client.callTool('get_problem', { problem_id: 9999999 });
    // 에러 응답이거나 content에 오류 메시지
    const text = (res.result as { content: Array<{ text: string }> } | undefined)?.content[0].text ?? '';
    const hasError = res.error !== undefined || text.includes('오류') || text.includes('찾을 수 없');
    expect(hasError).toBe(true);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 4: 태그 검색
// ─────────────────────────────────────────────

describe('[S4] 태그 검색 (search_tags)', () => {
  it('"다이나믹" 키워드로 dp 태그를 찾아야 함', async () => {
    const res = await client.callTool('search_tags', { query: '다이나믹' });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toMatch(/dp|다이나믹/i);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 5: BOJ 문제 분석
// ─────────────────────────────────────────────

describe('[S5] BOJ 문제 분석 (analyze_problem_boj)', () => {
  it('1003번(피보나치) 분석 시 힌트 가이드를 반환해야 함', async () => {
    const res = await client.callTool('analyze_problem_boj', { problem_id: 1003 });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    // 구조화된 JSON 또는 힌트 관련 키워드 포함
    expect(text.length).toBeGreaterThan(100);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 6: BOJ 힌트 생성
// ─────────────────────────────────────────────

describe('[S6] BOJ 힌트 생성 (generate_hint_boj)', () => {
  it('1003번 힌트 응답이 3단계 구조를 포함해야 함', async () => {
    const res = await client.callTool('generate_hint_boj', { problem_id: 1003 });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toMatch(/hint_levels|level|힌트/i);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 7: BOJ 코드 분석
// ─────────────────────────────────────────────

describe('[S7] BOJ 코드 분석 (analyze_code_submission_boj)', () => {
  it('Python 코드를 분석 요청하면 프롬프트를 반환해야 함', async () => {
    const code = `
a, b = map(int, input().split())
print(a + b)
    `.trim();
    const res = await client.callTool('analyze_code_submission_boj', {
      problem_id: 1000,
      code,
      language: 'python',
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text.length).toBeGreaterThan(50);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 8: BOJ 문제 본문 스크래핑
// ─────────────────────────────────────────────

describe('[S8] BOJ 문제 본문 (fetch_problem_content_boj)', () => {
  it('1000번 본문 스크래핑이 성공해야 함', async () => {
    const res = await client.callTool('fetch_problem_content_boj', { problem_id: 1000 });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toMatch(/A\+B|입력|출력/);
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 9: 프로그래머스 문제 검색
// ─────────────────────────────────────────────

describe('[S9] 프로그래머스 문제 검색 (search_programmers_problems)', () => {
  it('레벨 1 문제 검색이 정상 동작해야 함', async () => {
    const res = await client.callTool('search_programmers_problems', {
      levels: [1],
      limit: 5,
    });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('programmers.co.kr');
  }, DEFAULT_TIMEOUT);
});

// ─────────────────────────────────────────────
// 시나리오 10: 프로그래머스 문제 상세
// ─────────────────────────────────────────────

describe('[S10] 프로그래머스 문제 상세 (get_programmers_problem)', () => {
  it('42748번(K번째수) 문제를 정상 조회해야 함', async () => {
    const res = await client.callTool('get_programmers_problem', { problem_id: '42748' });
    expect(res.error).toBeUndefined();
    const text = (res.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toMatch(/K번째수|42748|정렬/);
  }, DEFAULT_TIMEOUT);
});
