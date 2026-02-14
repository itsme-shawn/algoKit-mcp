/**
 * 문제 분석 및 복습 템플릿 관련 타입 정의
 *
 * Phase 5: 프롬프트 기반 아키텍처
 *
 * 설계 원칙:
 * - MCP 서버: solved.ac 메타데이터 + 가이드 프롬프트 제공
 * - Claude Code: 가이드 프롬프트를 활용하여 문제별 맞춤 힌트 생성
 */

import type { Problem } from '../api/types.js';

/**
 * 문제 분석 결과
 *
 * MCP 서버가 반환하는 최상위 데이터 구조.
 * solved.ac 메타데이터와 Claude Code용 가이드 프롬프트를 포함한다.
 */
export interface ProblemAnalysis {
  /** solved.ac 원본 문제 데이터 */
  problem: Problem;
  /** 난이도 컨텍스트 (티어, 백분위 등) */
  difficulty: DifficultyContext;
  /** 태그 정보 (solved.ac 태그 키 + 한글명) */
  tags: TagInfo[];
  /** 유사 문제 목록 */
  similar_problems: Problem[];
  /** Claude Code를 위한 힌트 생성 가이드 */
  hint_guide: HintGuide;
}

/**
 * 난이도 컨텍스트
 *
 * solved.ac의 level(1~30)을 사람이 읽기 쉬운 형태로 변환한 결과.
 */
export interface DifficultyContext {
  /** 티어 문자열 (예: "Silver II") */
  tier: string;
  /** solved.ac 레벨 숫자 (1~30) */
  level: number;
  /** 티어 이모지 (예: "⚪") */
  emoji: string;
  /** 백분위 설명 (예: "초급 (상위 70-80%)") */
  percentile: string;
  /** 컨텍스트 요약 (예: "Silver 난이도의 다이나믹 프로그래밍 문제") */
  context: string;
}

/**
 * 간소화된 태그 정보
 *
 * solved.ac 태그에서 추출한 최소한의 식별 정보.
 */
export interface TagInfo {
  /** solved.ac 태그 키 (예: "dp") */
  key: string;
  /** 한글 표시명 (예: "다이나믹 프로그래밍") */
  name_ko: string;
}

/**
 * 힌트 생성 가이드
 *
 * Claude Code에게 문제별 맞춤 힌트를 생성하는 방법을 안내하는 프롬프트 모음.
 */
export interface HintGuide {
  /** 문제 컨텍스트 요약 */
  context: string;
  /** 3단계 힌트 레벨별 가이드 프롬프트 */
  hint_levels: HintLevelGuide[];
  /** 복습 시 활용할 가이드 프롬프트 */
  review_prompts: ReviewPrompts;
}

/**
 * 힌트 레벨 가이드
 *
 * - Level 1: 방향 암시 (알고리즘 이름 언급 금지)
 * - Level 2: 핵심 통찰 (알고리즘 명시, 구현은 안 줌)
 * - Level 3: 풀이 전략 (단계별 접근법)
 */
export interface HintLevelGuide {
  /** 힌트 레벨 (1, 2, 3) */
  level: 1 | 2 | 3;
  /** 레벨 이름 */
  label: string;
  /** Claude Code를 위한 힌트 생성 지시 프롬프트 */
  prompt: string;
}

/**
 * 복습 가이드 프롬프트
 */
export interface ReviewPrompts {
  /** 풀이 접근법을 묻는 프롬프트 */
  solution_approach: string;
  /** 시간 복잡도 분석을 유도하는 프롬프트 */
  time_complexity: string;
  /** 공간 복잡도 분석을 유도하는 프롬프트 */
  space_complexity: string;
  /** 핵심 인사이트를 묻는 프롬프트 */
  key_insights: string;
  /** 어려웠던 점을 묻는 프롬프트 */
  difficulties: string;
}

/**
 * 복습 템플릿
 */
export interface ReviewTemplate {
  /** 마크다운 형식의 복습 템플릿 */
  template: string;
  /** 문제 요약 데이터 */
  problem_data: ProblemData;
  /** 유사 문제 목록 */
  related_problems: Problem[];
  /** 힌트 가이드 */
  hint_guide: HintGuide;
  /** 상세 가이드라인 MCP Resource URI */
  guideline_uri: string;
  /** 가이드라인 요약 (빠른 참조용) */
  guideline_summary: GuidelineSummary;
}

/**
 * 가이드라인 요약
 */
export interface GuidelineSummary {
  /** 7단계 문서 구조 */
  structure: string[];
  /** 핵심 작성 규칙 */
  key_rules: string[];
}

/**
 * 문제 데이터 (요약)
 */
export interface ProblemData {
  /** 문제 번호 */
  id: number;
  /** 문제 제목 (한글) */
  title: string;
  /** 티어 뱃지 (이모지 포함) */
  tier: string;
  /** 태그 이름 목록 (한글) */
  tags: string[];
  /** 통계 정보 */
  stats: {
    acceptedUserCount: number;
    averageTries: number;
  };
}
