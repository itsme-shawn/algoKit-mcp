#!/usr/bin/env node

/**
 * cote-mcp-server
 * 백준 온라인 저지 알고리즘 문제 학습을 돕는 MCP 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

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

/**
 * MCP 서버 초기화
 */
const server = new Server(
  {
    name: 'cote-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
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

      case 'health_check': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'ok',
                  timestamp: new Date().toISOString(),
                  server: 'cote-mcp-server',
                  version: '1.0.0',
                  tools: ['search_problems', 'get_problem', 'search_tags', 'health_check'],
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
