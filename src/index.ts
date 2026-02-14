#!/usr/bin/env node

/**
 * AlgoKit
 * 백준 온라인 저지 알고리즘 문제 학습을 돕는 MCP 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 도구 임포트
import {
  searchProblems,
  SearchProblemsInputSchema,
} from './tools/search-problems.js';
import {
  getProblem,
  GetProblemInputSchema,
} from './tools/get-problem.js';
import {
  searchTags,
  SearchTagsInputSchema,
} from './tools/search-tags.js';
import {
  analyzeProblemTool,
  AnalyzeProblemInputSchema,
} from './tools/analyze-problem.js';
import {
  generateReviewTemplateTool,
  GenerateReviewTemplateInputSchema,
} from './tools/generate-review-template.js';
import {
  generateHintTool,
  GenerateHintInputSchema,
} from './tools/generate-hint.js';
import {
  fetchProblemContentTool,
  FetchProblemContentInputSchema,
} from './tools/fetch-problem-content.js';
import {
  analyzeCodeSubmissionTool,
  AnalyzeCodeSubmissionInputSchema,
} from './tools/analyze-code-submission.js';

// 서비스 임포트
import { SolvedAcClient } from './api/solvedac-client.js';
import { ProblemAnalyzer } from './services/problem-analyzer.js';
import { ReviewTemplateGenerator } from './services/review-template-generator.js';

/**
 * 서비스 초기화
 */
const apiClient = new SolvedAcClient();
const problemAnalyzer = new ProblemAnalyzer(apiClient);
const reviewTemplateGenerator = new ReviewTemplateGenerator(problemAnalyzer);

// 도구 객체 생성
const analyzeProblemToolObj = analyzeProblemTool(problemAnalyzer);
const generateReviewTemplateToolObj = generateReviewTemplateTool(reviewTemplateGenerator);
const generateHintToolObj = generateHintTool(problemAnalyzer);
const fetchProblemContentToolObj = fetchProblemContentTool();
const analyzeCodeSubmissionToolObj = analyzeCodeSubmissionTool();

/**
 * MCP 서버 초기화
 */
const server = new Server(
  {
    name: 'AlgoKit',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * 도구 목록 제공
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_problems',
        description:
          'BOJ 문제를 검색합니다. 키워드, 난이도 레벨, 알고리즘 태그로 필터링할 수 있습니다. ' +
          '⚠️ **중요**: 결과는 마크다운 테이블로 반환되며, 각 문제번호는 https://www.acmicpc.net/problem/{ID} 형태의 마크다운 링크로 제공됩니다. ' +
          '사용자에게 보여줄 때는 이 링크들을 반드시 유지해야 합니다. ' +
          '예: Gold 티어의 DP 문제 검색, Silver 이하 그리디 문제 검색 등',
        inputSchema: zodToJsonSchema(SearchProblemsInputSchema as any) as any,
      },
      {
        name: 'get_problem',
        description:
          '특정 BOJ 문제의 상세 정보를 조회합니다. 문제 번호로 난이도, 태그, 통계 등을 확인할 수 있습니다.',
        inputSchema: zodToJsonSchema(GetProblemInputSchema as any) as any,
      },
      {
        name: 'search_tags',
        description:
          '알고리즘 태그를 검색합니다. 한글 또는 영문 키워드로 관련 태그를 찾을 수 있습니다. ' +
          '예: "다이나믹", "그래프", "이분 탐색" 등',
        inputSchema: zodToJsonSchema(SearchTagsInputSchema as any) as any,
      },
      {
        name: 'analyze_problem',
        description:
          'BOJ 문제를 분석하고 힌트 생성 가이드를 제공합니다. ' +
          '난이도 컨텍스트, 태그 정보, 3단계 힌트 가이드 프롬프트, 유사 문제 추천을 포함합니다.',
        inputSchema: zodToJsonSchema(AnalyzeProblemInputSchema as any) as any,
      },
      {
        name: 'generate_review_template',
        description:
          'BOJ 문제 복습을 위한 마크다운 템플릿과 가이드 프롬프트를 생성합니다. ' +
          '템플릿을 기반으로 대화형으로 복습 문서를 작성할 수 있습니다.',
        inputSchema: zodToJsonSchema(GenerateReviewTemplateInputSchema as any) as any,
      },
      {
        name: 'generate_hint',
        description: generateHintToolObj.description,
        inputSchema: zodToJsonSchema(GenerateHintInputSchema as any) as any,
      },
      {
        name: 'fetch_problem_content',
        description: fetchProblemContentToolObj.description,
        inputSchema: zodToJsonSchema(FetchProblemContentInputSchema as any) as any,
      },
      {
        name: 'analyze_code_submission',
        description: analyzeCodeSubmissionToolObj.description,
        inputSchema: zodToJsonSchema(AnalyzeCodeSubmissionInputSchema as any) as any,
      },
      {
        name: 'health_check',
        description: 'MCP 서버 상태 확인',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * 리소스 목록 제공
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'algokit://tier-guide',
        name: '난이도 시스템 가이드',
        description: '백준 난이도 레벨(1-30)과 각 티어의 설명, 학습 추천 난이도',
        mimeType: 'application/json',
      },
      {
        uri: 'algokit://use-cases',
        name: '일반적인 사용 패턴',
        description: '초보자 문제, 면접 준비, 일일 문제, 알고리즘별 학습 등 일반적인 검색 패턴',
        mimeType: 'application/json',
      },
      {
        uri: 'algokit://review-guideline',
        name: '복기 템플릿 작성 가이드라인',
        description: '7단계 구조화된 코딩 테스트 복기 문서 작성 규칙 (MD 형식)',
        mimeType: 'text/markdown',
      },
    ],
  };
});

/**
 * 리소스 읽기 핸들러
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'algokit://tier-guide') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              description: '백준 난이도 시스템 (총 30 레벨)',
              levels: [
                {
                  level: '1-5',
                  tier: 'Bronze V-I',
                  description: '알고리즘 입문 단계',
                  characteristics: '기본 문법, 반복문, 조건문 학습',
                  studyTime: '1-2주',
                  recommendedFor: '프로그래밍 처음 배우는 사람',
                },
                {
                  level: '6-10',
                  tier: 'Silver V-I',
                  description: '기초 알고리즘 학습',
                  characteristics: '자료구조, 정렬, 탐색, 간단한 DP',
                  studyTime: '3-4주',
                  recommendedFor: '코딩테스트 준비 시작 단계',
                },
                {
                  level: '11-15',
                  tier: 'Gold V-I',
                  description: '중급 알고리즘',
                  characteristics: '고급 DP, 그래프, 이진 탐색, 그리디',
                  studyTime: '4-6주',
                  recommendedFor: '대부분의 기업 코테 수준',
                },
                {
                  level: '16-20',
                  tier: 'Platinum V-I',
                  description: '고급 알고리즘',
                  characteristics: '복합 알고리즘, 구간 트리, 네트워크 플로우',
                  studyTime: '2-3개월',
                  recommendedFor: '상위 기업 코테, 대회',
                },
                {
                  level: '21-30',
                  tier: 'Diamond V - Ruby I',
                  description: '매우 높은 수준',
                  characteristics: '극한 최적화, 고급 수학',
                  studyTime: '3개월 이상',
                  recommendedFor: '경쟁적 프로그래밍, 연구 수준',
                },
              ],
              tips: [
                '단계별로 진행하는 것이 중요합니다',
                '한 난이도에서 충분히 연습한 후 다음 단계로 진행하세요',
                '자신의 수준에 맞는 문제에서 시작하세요',
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'algokit://use-cases') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              description: '검색 도구 사용의 일반적인 패턴',
              patterns: [
                {
                  name: '초보자 문제',
                  description: '프로그래밍을 처음 배우는 사람을 위한 문제',
                  searchParams: {
                    level_min: 1,
                    level_max: 10,
                  },
                  tips: '기본 문법과 간단한 알고리즘부터 시작하세요',
                },
                {
                  name: '코딩테스트 준비',
                  description: '기업 코딩테스트 준비를 위한 적절한 난이도',
                  searchParams: {
                    level_min: 11,
                    level_max: 18,
                  },
                  tips: 'Gold ~ Platinum 수준의 문제로 준비하세요',
                },
                {
                  name: '일일 문제 도전',
                  description: '매일 풀 수 있는 적절한 난이도의 문제',
                  searchParams: {
                    level_min: 9,
                    level_max: 14,
                  },
                  tips: '자신의 수준보다 약간 높은 문제가 좋습니다',
                },
                {
                  name: 'DP 알고리즘 학습',
                  description: '동적 계획법 알고리즘을 배우기 위한 문제',
                  searchParams: {
                    tag: 'dynamic_programming',
                    level_min: 8,
                    level_max: 15,
                  },
                  tips: '쉬운 것부터 어려운 것으로 순서대로 풀어보세요',
                },
                {
                  name: '그래프 알고리즘',
                  description: '그래프 탐색 및 경로 찾기 문제',
                  searchParams: {
                    tag: 'graphs',
                    level_min: 9,
                    level_max: 16,
                  },
                  tips: 'BFS, DFS, 다익스트라 등을 순서대로 학습하세요',
                },
                {
                  name: '그리디 알고리즘',
                  description: '탐욕 알고리즘 문제',
                  searchParams: {
                    tag: 'greedy',
                    level_min: 8,
                    level_max: 13,
                  },
                  tips: '그리디 선택이 최적임을 증명할 수 있어야 합니다',
                },
                {
                  name: '이진 탐색',
                  description: '이진 탐색 알고리즘 학습',
                  searchParams: {
                    tag: 'binary_search',
                    level_min: 8,
                    level_max: 14,
                  },
                  tips: '조건을 명확히 정의하는 것이 중요합니다',
                },
                {
                  name: '면접 대비 구현 문제',
                  description: '기업 면접에 자주 나오는 구현 문제',
                  searchParams: {
                    tag: 'implementation',
                    level_min: 12,
                    level_max: 17,
                  },
                  tips: '세부 조건을 꼼꼼히 읽고 구현하세요',
                },
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'algokit://review-guideline') {
    try {
      // ESM에서 __dirname 대체
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      // 빌드 후: dist/templates/review-guideline.md
      const guidelinePath = join(__dirname, 'templates/review-guideline.md');
      const content = await readFile(guidelinePath, 'utf-8');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read review guideline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error(`Unknown resource: ${uri}`);
});

/**
 * 도구 호출 핸들러
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_problems': {
        const input = SearchProblemsInputSchema.parse(args);
        const result = await searchProblems(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_problem': {
        const input = GetProblemInputSchema.parse(args);
        const result = await getProblem(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'search_tags': {
        const input = SearchTagsInputSchema.parse(args);
        const result = await searchTags(input);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'analyze_problem': {
        const input = AnalyzeProblemInputSchema.parse(args);
        const result = await analyzeProblemToolObj.handler(input);
        return {
          content: [result],
        };
      }

      case 'generate_review_template': {
        const input = GenerateReviewTemplateInputSchema.parse(args);
        const result = await generateReviewTemplateToolObj.handler(input);
        return {
          content: [result],
        };
      }

      case 'generate_hint': {
        const input = GenerateHintInputSchema.parse(args);
        const result = await generateHintToolObj.handler(input);
        return {
          content: [result],
        };
      }

      case 'fetch_problem_content': {
        const input = FetchProblemContentInputSchema.parse(args);
        const result = await fetchProblemContentToolObj.handler(input);
        return {
          content: [result],
        };
      }

      case 'analyze_code_submission': {
        const input = AnalyzeCodeSubmissionInputSchema.parse(args);
        const result = await analyzeCodeSubmissionToolObj.handler(input);
        return {
          content: [result],
        };
      }

      case 'health_check': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'ok',
                  timestamp: new Date().toISOString(),
                  server: 'AlgoKit',
                  version: '1.0.0',
                  tools: [
                    'search_problems',
                    'get_problem',
                    'search_tags',
                    'analyze_problem',
                    'generate_review_template',
                    'generate_hint',
                    'fetch_problem_content',
                    'analyze_code_submission',
                    'health_check'
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // 에러 처리
    if (error instanceof Error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 오류: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: '❌ 알 수 없는 오류가 발생했습니다.',
        },
      ],
      isError: true,
    };
  }
});

/**
 * 서버 시작
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
