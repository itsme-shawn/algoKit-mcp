/**
 * CodeAnalyzer 서비스 테스트
 *
 * Phase 6 - P6-005: 코드 분석 프롬프트 생성 서비스 구현
 */

import { describe, it, expect } from 'vitest';
import { CodeAnalyzer } from '../../src/services/code-analyzer.js';
import type {
  ProblemContent,
  CodeSubmission,
  AnalysisType,
} from '../../src/types/problem-content.js';

describe('CodeAnalyzer', () => {
  // 테스트용 문제 데이터
  const mockProblemContent: ProblemContent = {
    problemId: 1000,
    title: 'A+B',
    description: '두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.',
    inputFormat: '첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)',
    outputFormat: '첫째 줄에 A+B를 출력한다.',
    examples: [
      {
        input: '1 2',
        output: '3',
      },
    ],
    limits: {
      timeLimit: '2초',
      memoryLimit: '128MB',
    },
    metadata: {
      fetchedAt: '2026-02-14T00:00:00.000Z',
      source: 'cache',
      cacheExpiresAt: '2026-02-15T00:00:00.000Z',
    },
  };

  describe('코드 메타데이터 추출', () => {
    it('Python 코드 메타데이터를 추출한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `def solve():
    a, b = map(int, input().split())
    print(a + b)

def main():
    solve()

if __name__ == "__main__":
    main()`,
        language: 'python',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.codeMetadata).toMatchObject({
        language: 'python',
        lineCount: 9,
        functionCount: 2, // solve, main
      });
    });

    it('C++ 코드 메타데이터를 추출한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
        language: 'cpp',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.codeMetadata).toMatchObject({
        language: 'cpp',
        lineCount: 9,
        functionCount: 1, // main
      });
    });

    it('JavaScript 코드 메타데이터를 추출한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `function solve() {
    const input = require('fs').readFileSync('/dev/stdin').toString().trim();
    const [a, b] = input.split(' ').map(Number);
    console.log(a + b);
}

solve();`,
        language: 'javascript',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.codeMetadata).toMatchObject({
        language: 'javascript',
        lineCount: 7,
        functionCount: 1, // solve
      });
    });

    it('Java 코드 메타데이터를 추출한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
        language: 'java',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.codeMetadata).toMatchObject({
        language: 'java',
        lineCount: 10,
        functionCount: 1, // main
      });
    });

    it('Go 코드 메타데이터를 추출한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `package main

import "fmt"

func solve() {
    var a, b int
    fmt.Scan(&a, &b)
    fmt.Println(a + b)
}

func main() {
    solve()
}`,
        language: 'go',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.codeMetadata).toMatchObject({
        language: 'go',
        lineCount: 13,
        functionCount: 2, // solve, main
      });
    });
  });

  describe('분석 타입별 프롬프트 생성', () => {
    const submission: CodeSubmission = {
      problemId: 1000,
      code: `a, b = map(int, input().split())
print(a + b)`,
      language: 'python',
      submittedAt: '2026-02-14T00:00:00.000Z',
    };

    it('full 분석 프롬프트를 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.analysisPrompts.systemPrompt).toContain(
        '알고리즘 문제 풀이 전문가',
      );
      expect(result.analysisPrompts.systemPrompt).toContain('A+B');
      expect(result.analysisPrompts.systemPrompt).toContain('정확성');
      expect(result.analysisPrompts.systemPrompt).toContain('복잡도');

      expect(result.analysisPrompts.userPrompt).toContain('python');
      expect(result.analysisPrompts.userPrompt).toContain(submission.code);
    });

    it('hint 분석 프롬프트를 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'hint',
      );

      expect(result.analysisPrompts.systemPrompt).toContain('힌트');
      expect(result.analysisPrompts.systemPrompt).toContain('문제 이해');
      expect(result.analysisPrompts.systemPrompt).toContain('접근 방법');
    });

    it('debug 분석 프롬프트를 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'debug',
      );

      expect(result.analysisPrompts.systemPrompt).toContain('디버깅');
      expect(result.analysisPrompts.systemPrompt).toContain('에러');
      expect(result.analysisPrompts.systemPrompt).toContain('수정');
    });

    it('review 분석 프롬프트를 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'review',
      );

      expect(result.analysisPrompts.systemPrompt).toContain('코드 리뷰');
      expect(result.analysisPrompts.systemPrompt).toContain('개선');
      expect(result.analysisPrompts.systemPrompt).toContain('베스트 프랙티스');
    });
  });

  describe('프롬프트 구조 검증', () => {
    it('시스템 프롬프트에 문제 본문 전체가 포함된다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: 'print("test")',
        language: 'python',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      const { systemPrompt } = result.analysisPrompts;

      // 문제 제목
      expect(systemPrompt).toContain(mockProblemContent.title);

      // 문제 설명
      expect(systemPrompt).toContain(mockProblemContent.description);

      // 입출력 형식
      expect(systemPrompt).toContain(mockProblemContent.inputFormat);
      expect(systemPrompt).toContain(mockProblemContent.outputFormat);

      // 예제
      expect(systemPrompt).toContain(mockProblemContent.examples[0].input);
      expect(systemPrompt).toContain(mockProblemContent.examples[0].output);

      // 제한사항
      expect(systemPrompt).toContain(mockProblemContent.limits.timeLimit);
      expect(systemPrompt).toContain(mockProblemContent.limits.memoryLimit);
    });

    it('사용자 프롬프트에 코드와 언어 정보가 포함된다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: `def solve():
    print("Hello")`,
        language: 'python',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      const { userPrompt } = result.analysisPrompts;

      expect(userPrompt).toContain('python');
      expect(userPrompt).toContain(submission.code);
    });
  });

  describe('추천 질문 생성', () => {
    const submission: CodeSubmission = {
      problemId: 1000,
      code: 'print("test")',
      language: 'python',
      submittedAt: '2026-02-14T00:00:00.000Z',
    };

    it('full 분석 타입에 맞는 추천 질문을 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      expect(result.suggestedQuestions).toHaveLength(5);
      expect(
        result.suggestedQuestions.some(q => q.includes('복잡도')),
      ).toBe(true);
      expect(
        result.suggestedQuestions.some(q => q.includes('개선')),
      ).toBe(true);
    });

    it('hint 분석 타입에 맞는 추천 질문을 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'hint',
      );

      expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
      expect(
        result.suggestedQuestions.some(q => q.includes('시작')),
      ).toBe(true);
    });

    it('debug 분석 타입에 맞는 추천 질문을 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'debug',
      );

      expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
      expect(
        result.suggestedQuestions.some(q => q.includes('에러')),
      ).toBe(true);
    });

    it('review 분석 타입에 맞는 추천 질문을 생성한다', async () => {
      const analyzer = new CodeAnalyzer();
      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'review',
      );

      expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
      expect(
        result.suggestedQuestions.some(q => q.includes('개선')),
      ).toBe(true);
    });
  });

  describe('전체 결과 구조 검증', () => {
    it('CodeAnalysisResult 구조를 올바르게 반환한다', async () => {
      const analyzer = new CodeAnalyzer();
      const submission: CodeSubmission = {
        problemId: 1000,
        code: 'print("test")',
        language: 'python',
        submittedAt: '2026-02-14T00:00:00.000Z',
      };

      const result = await analyzer.analyzeCode(
        mockProblemContent,
        submission,
        'full',
      );

      // 구조 검증
      expect(result).toHaveProperty('problemInfo');
      expect(result).toHaveProperty('codeMetadata');
      expect(result).toHaveProperty('analysisPrompts');
      expect(result).toHaveProperty('suggestedQuestions');

      // 타입 검증
      expect(result.problemInfo).toBe(mockProblemContent);
      expect(result.codeMetadata).toMatchObject({
        language: 'python',
        lineCount: expect.any(Number),
        functionCount: expect.any(Number),
      });
      expect(result.analysisPrompts).toMatchObject({
        systemPrompt: expect.any(String),
        userPrompt: expect.any(String),
      });
      expect(Array.isArray(result.suggestedQuestions)).toBe(true);
    });
  });
});
