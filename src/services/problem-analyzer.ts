/**
 * ProblemAnalyzer 서비스
 *
 * 문제 분석 및 힌트 가이드 생성 (프롬프트 기반 아키텍처)
 *
 * MCP 서버는 solved.ac 메타데이터와 가이드 프롬프트만 제공하고,
 * Claude Code가 문제별 맞춤 힌트를 생성합니다.
 */

import type { SolvedAcClient } from '../api/solvedac-client.js';
import type { Problem } from '../api/types.js';
import type {
  ProblemAnalysis,
  DifficultyContext,
  TagInfo,
} from '../types/analysis.js';
import { levelToTier, getTierBadge } from '../utils/tier-converter.js';
import { buildHintGuide } from '../prompts/hint-guide.js';

/**
 * ProblemAnalyzer 클래스
 */
export class ProblemAnalyzer {
  constructor(private apiClient: SolvedAcClient) {}

  /**
   * 문제 분석 및 힌트 가이드 생성
   */
  async analyze(
    problemId: number,
    includeSimilar = true,
  ): Promise<ProblemAnalysis> {
    // 1. 문제 정보 조회
    const problem = await this.apiClient.getProblem(problemId);

    // 2. 난이도 컨텍스트 생성
    const difficulty = this.buildDifficultyContext(problem);

    // 3. 태그 정보 추출
    const tags = this.extractTags(problem);

    // 4. 유사 문제 추천
    const similarProblems = includeSimilar
      ? await this.findSimilarProblems(problem)
      : [];

    // 5. 힌트 가이드 생성 (프롬프트 템플릿에 메타데이터 주입)
    const hintGuide = buildHintGuide(problem, difficulty, tags);

    return {
      problem,
      difficulty,
      tags,
      similar_problems: similarProblems,
      hint_guide: hintGuide,
    };
  }

  /**
   * 난이도 컨텍스트 빌드
   */
  private buildDifficultyContext(problem: Problem): DifficultyContext {
    const tier = levelToTier(problem.level);
    const badge = getTierBadge(problem.level);
    const emoji = badge.split(' ')[0];

    const percentile = this.getPercentile(problem.level);

    const primaryTag =
      problem.tags[0]?.displayNames.find(dn => dn.language === 'ko')?.name ||
      '알고리즘';
    const tierGroup = tier.split(' ')[0];
    const context = `${tierGroup} 난이도의 ${primaryTag} 문제`;

    return {
      tier,
      level: problem.level,
      emoji,
      percentile,
      context,
    };
  }

  /**
   * 백분위 계산
   */
  private getPercentile(level: number): string {
    if (level <= 5) return '입문';
    if (level <= 10) return '초급 (상위 70-80%)';
    if (level <= 15) return '중급 (상위 40-60%)';
    if (level <= 20) return '중상급 (상위 10-30%)';
    if (level <= 25) return '고급 (상위 3-10%)';
    return '최상급 (상위 1%)';
  }

  /**
   * 태그 정보 추출
   */
  private extractTags(problem: Problem): TagInfo[] {
    return problem.tags.map(tag => ({
      key: tag.key,
      name_ko:
        tag.displayNames.find(dn => dn.language === 'ko')?.name || tag.key,
    }));
  }

  /**
   * 유사 문제 추천
   */
  private async findSimilarProblems(problem: Problem): Promise<Problem[]> {
    try {
      const primaryTag = problem.tags[0]?.key;
      if (!primaryTag) return [];

      const levelMin = Math.max(1, problem.level - 2);
      const levelMax = Math.min(30, problem.level + 2);

      const results = await this.apiClient.searchProblems({
        tags: primaryTag,
        level_min: levelMin,
        level_max: levelMax,
        sort: 'level',
        direction: 'asc',
      });

      return results.items
        .filter(p => p.problemId !== problem.problemId)
        .slice(0, 5);
    } catch {
      return [];
    }
  }
}
