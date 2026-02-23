---
name: algo:review
description: 백준(BOJ) 또는 프로그래머스 풀이 후 복습 문서 생성. 풀이를 마친 뒤 학습 내용을 정리하고 싶을 때 사용.
---

# algo:review - 알고리즘 풀이 복습 템플릿

백준(BOJ)과 프로그래머스 문제 풀이 후 복습 문서를 생성하는 스킬입니다.

## 사용법

```
/algo:review <문제식별자>
```

**예시:**
- `/algo:review 1003` - 숫자만 입력 → 플랫폼 질문
- `/algo:review https://school.programmers.co.kr/learn/courses/30/lessons/42748` - URL → 프로그래머스 확정
- `/algo:review https://www.acmicpc.net/problem/1003` - URL → BOJ 확정

## 플랫폼 판별 규칙

| 입력 패턴 | 플랫폼 | 예시 |
|-----------|--------|------|
| `acmicpc.net` URL | BOJ | `https://www.acmicpc.net/problem/1003` |
| `school.programmers.co.kr` URL | Programmers | `https://school.programmers.co.kr/...` |
| **숫자만 입력** | **→ 반드시 되묻기** | `1003`, `42748` |

단, **대화 맥락에서 플랫폼이 이미 확인된 경우** (예: "프로그래머스 풀었어", 직전에 특정 플랫폼 문제를 함께 논의 중)에는 되묻지 않고 그 플랫폼으로 진행합니다.

> ⚠️ **맥락이 없는 숫자 입력은 절대 임의로 플랫폼을 추정하지 않습니다.**

## 동작 방식

1. **플랫폼 판별**: 위 규칙 적용 → 불명확하면 즉시 되묻기
2. **MCP 도구 호출**: 플랫폼별 `generate_review_template_*` 실행
3. **템플릿 및 가이드 수신**:
   - 마크다운 복습 템플릿
   - 문제 분석 정보 (난이도, 태그/카테고리, 설명)
   - 복습 가이드 프롬프트
   - 관련 문제 추천
4. **대화형 복습 작성**: 사용자와 함께 섹션별 작성

## MCP 도구 사용

### BOJ

```
algokit/generate_review_template_boj { problem_id: 1003 }
```

### 프로그래머스

```
algokit/generate_review_template_programmers { problem_id: 42748 }
```

## 복습 문서 구조

```markdown
# [문제번호] 문제 제목

## 문제 요약
- **플랫폼**: BOJ / 프로그래머스
- **난이도**: Silver III (BOJ) / 레벨 2 (프로그래머스)
- **알고리즘**: DP, Memoization
- **풀이 날짜**: YYYY-MM-DD

## 핵심 아이디어
<!-- 사용자와 대화하며 작성 -->

## 내 풀이

### 코드
```python
# 사용자 코드 삽입
```

### 시간복잡도
<!-- 분석 결과 작성 -->

## 배운 점
<!-- 학습 내용 정리 -->

## 개선 방향
<!-- 개선 포인트 제안 -->

## 관련 문제
<!-- 유사 문제 목록 -->
```

## 저장 위치 제안

- BOJ: `reviews/BOJ/{문제번호}_REVIEW.md`
  - 예: `reviews/BOJ/1003_REVIEW.md`
- 프로그래머스: `reviews/Programmers/{문제번호}_REVIEW.md`
  - 예: `reviews/Programmers/42748_REVIEW.md`

## 대화형 작성 프로세스

1. **코드 확인**: "풀이 코드를 보여주세요"
2. **분석 및 질문**:
   - "어떤 접근법을 사용하셨나요?"
   - "어려웠던 부분은 무엇인가요?"
3. **복습 문서 작성**: 템플릿 기반 섹션별 작성
4. **저장 위치 제안**

## 주의사항

- ✅ 사용자와 대화하며 단계별 작성
- ✅ 가이드 프롬프트로 자연스러운 질문 생성
- ✅ 사용자 코드 기반 맞춤형 피드백
- ✅ 플랫폼별 난이도 표기 방식 준수 (BOJ: 티어명, Programmers: 레벨)
- ✅ 숫자만 입력된 경우 플랫폼 확인 후 진행
- ✅ 대화 맥락에서 플랫폼이 이미 확인된 경우 그 맥락 활용
- ❌ 단순 템플릿 덤프 금지
- ❌ 맥락 없이 플랫폼 임의 추정 금지

## 관련 스킬

- `/algo:hint` - 문제 힌트 생성
- `/algo:code-review` - 코드 상세 분석
- `/algo:search` - 관련 문제 검색
