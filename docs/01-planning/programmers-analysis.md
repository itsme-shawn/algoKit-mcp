# 프로그래머스(Programmers) 통합 가능성 분석 (최종)

**프로젝트명**: cote-mcp-server
**버전**: 2.0
**작성일**: 2026-02-15
**마지막 업데이트**: 2026-02-16
**작성자**: project-manager
**상태**: ✅ 재평가 완료

---

## 목차

1. [Executive Summary](#executive-summary)
2. [핵심 발견사항](#핵심-발견사항)
3. [실현가능성 평가](#실현가능성-평가)
4. [구현 계획](#구현-계획)
5. [제약사항 및 리스크](#제약사항-및-리스크)
6. [최종 의사결정](#최종-의사결정)
7. [참고 자료](#참고-자료)

---

## Executive Summary

프로그래머스(Programmers) 플랫폼 통합 가능성을 **Playwright 실증 검증**을 통해 재평가한 결과, **조건부 실현 가능**으로 결론지었습니다.

### 결론

✅ **실현 가능 (조건부)** - Puppeteer/Playwright 기반 스크래핑으로 구현 가능

### 진행 조건

1. Phase 4 완료 후 시작 (Rate Limiting, 로깅, 캐싱)
2. 1주일 POC로 파싱 안정성 검증 (성공률 90% 이상)
3. POC 성공 시 본격 개발 (3주), 실패 시 Phase 7 보류

### 핵심 지표

| 평가 항목 | 점수 | 평가 |
|----------|------|------|
| **기술적 실현 가능성** | 7/10 | Puppeteer 기반 구현 가능 ✅ |
| **법적 리스크** | 3/10 | robots.txt 허용, 로그인 불필요 ✅ |
| **성능** | 4/10 | BOJ 대비 5-10배 느림 ⚠️ |
| **유지보수성** | 5/10 | HTML 구조 변경 시 취약 ⚠️ |
| **메타데이터 품질** | 6/10 | 카테고리만 제공 (태그 없음) ⚠️ |

**종합 점수**: **25/50** (실현 가능, 제한적)

---

## 핵심 발견사항

### 1. 로그인 불필요 ✅

**이전 가정**: 로그인 필수로 판단 (추측 기반)

**실제 검증 (Playwright)**:
- 검색 페이지: `https://school.programmers.co.kr/learn/challenges` - ✅ 로그인 없이 접근 가능
- 문제 상세: `https://school.programmers.co.kr/learn/courses/30/lessons/389632` - ✅ 전체 본문 열람 가능

**영향**:
- 법적 리스크 대폭 감소
- 구현 난이도 하락
- 사용자 인증 시스템 불필요

### 2. robots.txt 허용 ✅

**URL**: `https://programmers.co.kr/robots.txt`

```
User-Agent: *
Allow: /
Disallow: /users
Disallow: /managers
Disallow: /cable
Disallow: /admin
Disallow: /start_trial
Disallow: /pr/*
```

**해석**:
- ✅ `/learn/challenges` 경로: 크롤링 허용
- ✅ `/learn/courses/*/lessons/*` 경로: 크롤링 허용
- ✅ `Allow: /` 존재: 기본적으로 모든 경로 허용

### 3. SPA 구조 (JavaScript 렌더링 필요) ⚠️

**발견**:
- curl/fetch: ❌ "브라우저 버전 경고" 페이지만 반환
- Puppeteer/Playwright: ✅ 전체 컨텐츠 렌더링 성공

**결론**:
- Headless 브라우저 필수
- React/Vue 등 프론트엔드 프레임워크 사용 추정

### 4. 데이터 추출 가능 ✅

**검색 페이지 (`/learn/challenges`)**:
```yaml
추출 가능한 데이터:
  - 제목: "[PCCE 기출문제] 3번 / 수 나누기"
  - URL: /learn/courses/30/lessons/340205
  - 카테고리: "PCCE 기출문제"
  - 난이도: "Lv. 0"
  - 풀이 수: "16,721명"
  - 정답률: "72%"
```

**문제 상세 페이지 (`/learn/courses/30/lessons/*`)**:
```yaml
추출 가능한 데이터:
  - 제목: "문자열과 알파벳과 쿼리"
  - 카테고리: "2025 프로그래머스 코드챌린지 본선"
  - 문제 설명: (전체 본문)
  - 제한사항: (리스트)
  - 테스트 케이스 구성: (테이블)
  - 입출력 예: (테이블)
  - 입출력 예 설명: (상세 설명)
```

---

## 실현가능성 평가

### BOJ vs Programmers 비교

| 항목 | BOJ (현재) | Programmers (계획) |
|------|-----------|-------------------|
| **데이터 소스** | solved.ac API | Puppeteer 스크래핑 |
| **로그인 요구** | ❌ 불필요 | ❌ 불필요 |
| **응답 시간** | 200-500ms | 3-5초 |
| **난이도 체계** | 1-30 (30단계) | Lv. 0-5 (6단계) |
| **알고리즘 태그** | ✅ 30+ 태그 | ❌ 없음 (카테고리만) |
| **문제 본문** | ✅ 스크래핑 | ✅ 스크래핑 |
| **파싱 안정성** | 🟢 높음 (정적) | 🟡 중간 (SPA) |
| **메모리 사용** | 50-100MB | 350-600MB |
| **유지보수 부담** | 🟢 낮음 | 🟡 중간 |

**기능 동등성**: **70%** (핵심 기능 대부분 구현 가능)

### 기능별 구현 가능성

| 기능 | BOJ (현재) | Programmers (가상) | 실현 가능성 |
|------|------------|---------------------|-------------|
| 문제 검색 | ✅ (solved.ac API) | ✅ (Puppeteer) | 🟡 중간 |
| 문제 상세 조회 | ✅ (API + 스크래핑) | ✅ (Puppeteer) | 🟡 중간 |
| 난이도 필터링 | ✅ (1-30 티어) | ✅ (Lv. 0-5) | 🟢 쉬움 |
| 알고리즘 태그 검색 | ✅ (30+ 태그) | ❌ (태그 없음) | 🔴 불가능 |
| 문제 분석 | ✅ (태그 기반) | ⚠️ (카테고리 기반) | 🟡 중간 |
| 힌트 생성 | ✅ (프롬프트 기반) | ⚠️ (제한적) | 🟡 중간 |
| 복습 템플릿 | ✅ (태그 활용) | ⚠️ (제한적) | 🟡 중간 |
| 코드 분석 | ✅ (BOJ 스크래핑) | ✅ (Puppeteer) | 🟡 중간 |

---

## 구현 계획

### Phase 7: 프로그래머스 통합 (4주)

**예상 기간**: 4주 (POC 1주 + 구현 3주)
**우선순위**: Phase 4 완료 후

| ID | 태스크 | 소요 | 우선순위 |
|----|--------|------|----------|
| P7-000 | POC 실험 (파싱 안정성 검증) | 1주 | P0 |
| P7-001 | Puppeteer 통합 및 브라우저 풀 | 2일 | P0 |
| P7-002 | ProgrammersScraper (검색) | 3일 | P0 |
| P7-003 | ProgrammersScraper (문제 상세) | 3일 | P0 |
| P7-004 | 멀티 플랫폼 지원 (MCP 도구) | 2일 | P1 |
| P7-005 | ProblemAnalyzer 확장 | 2일 | P1 |
| P7-006 | Rate Limiting 및 캐싱 | 2일 | P1 |
| P7-007 | 테스트 코드 작성 | 3일 | P0 |
| P7-008 | 문서 업데이트 | 1일 | P2 |

**총 예상 기간**: 4주 (18일)

### 아키텍처 설계

```
cote-mcp/
├── src/
│   ├── api/
│   │   ├── solvedac-client.ts          # 기존 (BOJ)
│   │   ├── programmers-scraper.ts       # 🆕 Puppeteer 기반
│   │   └── types.ts                     # 공통 타입 + Programmers 타입
│   ├── services/
│   │   ├── problem-analyzer.ts          # 멀티 플랫폼 지원으로 확장
│   │   └── review-template-generator.ts # 멀티 플랫폼 지원으로 확장
│   ├── tools/
│   │   ├── search-problems.ts           # platform 파라미터 추가
│   │   ├── get-problem.ts               # platform 파라미터 추가
│   │   └── analyze-problem.ts           # platform 파라미터 추가
│   └── utils/
│       ├── tier-converter.ts            # 기존 (BOJ)
│       ├── level-converter.ts           # 🆕 Programmers 레벨 변환
│       └── browser-pool.ts              # 🆕 Puppeteer 인스턴스 관리
└── package.json                         # puppeteer 추가
```

### 기술 스택

**추가 의존성**:
```json
{
  "dependencies": {
    "puppeteer": "^22.0.0",
    "puppeteer-core": "^22.0.0"
  },
  "devDependencies": {
    "@types/puppeteer": "^5.4.7"
  }
}
```

**선택 근거**:
- **Puppeteer**: ✅ 선택 (가장 안정적, 문서 풍부)
- **Playwright**: ⚠️ 가능 (멀티 브라우저 지원, 더 무거움)
- **Selenium**: ❌ 제외 (복잡하고 느림)

---

## 제약사항 및 리스크

### 기술적 제약

1. **브라우저 자동화 필수**
   - Puppeteer 의존성 추가 (무겁고 느림)
   - 메모리: +300-500MB
   - 응답 시간: 3-5초 (vs BOJ 200-500ms)

2. **HTML 파싱 불안정성**
   - CSS 클래스/구조 변경 시 즉시 오류
   - 주기적 파서 업데이트 필요

3. **메타데이터 제한**
   - ❌ 알고리즘 태그 없음 (DP, BFS, DFS 등)
   - ✅ 카테고리만 제공 ("PCCE 기출문제" 등)
   - ⚠️ 난이도 범위 좁음 (Lv. 0-5, 5단계)

4. **Rate Limiting 미지원**
   - 서버 측 Rate Limit 정보 없음
   - 과도한 요청 시 IP 차단 위험

### 리스크 및 대응 방안

#### 기술적 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|-------------|--------|----------|
| **HTML 구조 변경** | 🟡 중간 (3개월마다) | 🔴 높음 | 파서 테스트 자동화, 알림 시스템 |
| **Puppeteer 메모리 누수** | 🟡 중간 | 🟡 중간 | 브라우저 인스턴스 주기적 재시작 |
| **IP 차단** | 🟢 낮음 | 🔴 높음 | Rate Limiting (초당 5회), User-Agent 설정 |
| **성능 저하** | 🟡 중간 | 🟡 중간 | 캐싱, 병렬 제한, 리소스 차단 |

#### 법적 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|-------------|--------|----------|
| **ToS 위반** | 🟡 중간 | 🟡 중간 | robots.txt 준수, 이용약관 확인 |
| **저작권 침해** | 🟢 낮음 | 🟡 중간 | 문제 본문 일부만 캐싱, 원본 링크 제공 |
| **서비스 방해** | 🟢 낮음 | 🔴 높음 | Rate Limiting, 캐싱, 비상업적 사용 |

**대응 전략**:
1. **비상업적 사용 명시**: README에 "교육용, 비영리 프로젝트" 명시
2. **robots.txt 준수**: 주기적으로 robots.txt 확인
3. **프로그래머스 파트너십 제안**: 공식 API 요청 (장기)

### Go/No-Go 기준 (POC 실험)

#### Go 조건 (Phase 7 본격 개발 진행) ✅

- 검색 페이지 파싱 성공률 **90% 이상** (100회 요청)
- 문제 상세 파싱 성공률 **90% 이상** (50회 요청)
- 평균 응답 시간 **5초 이내**
- 메모리 사용량 **500MB 이내**

#### No-Go 조건 (Phase 7 보류) ❌

- 파싱 성공률 **90% 미만**
- 응답 시간 **5초 초과** (지속적)
- 메모리 누수 발생
- HTML 구조 변경 빈도 높음

**No-Go 시 대안**:
- Phase 7 보류
- Phase 8 (LeetCode 통합) 우선 진행
- 프로그래머스 공식 API 요청 (장기)

---

## 최종 의사결정

### 질문: "프로그래머스 통합을 진행할까요?"

### 답변: ✅ **예, 조건부 진행**

**조건**:
1. Phase 4 완료 후 시작
2. 1주일 POC로 파싱 안정성 검증 (성공률 90% 이상)
3. POC 성공 시 본격 개발 (3주), 실패 시 보류

**진행 이유**:
- ✅ 기술적 실현 가능 확인 (Playwright 검증)
- ✅ 법적 리스크 낮음 (robots.txt 허용, 로그인 불필요)
- ✅ 사용자 니즈 높음 (한국 기업 코딩테스트 표준)
- ✅ 기능 동등성 70% (핵심 기능 구현 가능)

**주의 사항**:
- ⚠️ 성능 저하 예상 (BOJ 대비 5-10배 느림)
- ⚠️ 유지보수 부담 (HTML 구조 변경 시 파서 업데이트)
- ⚠️ 메타데이터 제한 (알고리즘 태그 없음)

### 다음 단계

#### 즉시 (현재)
1. ✅ **Phase 4 완료**: Task 4.3 (로깅) + Task 4.4 (캐싱)
2. 📋 **사용자 승인 대기**: Phase 7 진행 여부 최종 결정

#### Phase 4 완료 후
3. 🆕 **Task 7.0: POC 실험** (1주)
   - Puppeteer 파싱 안정성 검증
   - Go/No-Go 의사결정

#### POC 성공 시
4. 🆕 **Phase 7 본격 개발** (3주)
   - ProgrammersScraper 클래스 구현
   - 멀티 플랫폼 지원
   - 테스트 및 문서화

#### POC 실패 시
4. ⏸️ **Phase 7 보류**
5. 🔄 **Phase 8: LeetCode 통합** 우선 검토

---

## 참고 자료

### 검증 자료
- **Playwright 테스트 결과**: `/tmp/programmers_challenges.md`
- **robots.txt**: `https://programmers.co.kr/robots.txt`
- **검색 페이지**: `https://school.programmers.co.kr/learn/challenges`
- **문제 상세**: `https://school.programmers.co.kr/learn/courses/30/lessons/389632`

### 기술 자료
- [Puppeteer 공식 문서](https://pptr.dev/)
- [Playwright 공식 문서](https://playwright.dev/)
- [웹 스크래핑 Best Practices](https://www.scrapehero.com/best-practices/)

### 관련 프로젝트
- [Puppeteer Extra](https://github.com/berstend/puppeteer-extra) (스텔스 플러그인)
- [Crawlee](https://crawlee.dev/) (스크래핑 프레임워크)

### 프로젝트 문서
- [Phase 7 태스크](/docs/03-project-management/TASKS.md#phase-7) - 구현 계획
- [CLAUDE.md](/CLAUDE.md) - 프로젝트 개요
- [아키텍처 문서](/docs/02-development/ARCHITECTURE.md) - 시스템 설계

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2026-02-15 | project-manager | 최초 작성 (Playwright 검증 기반) |
| 2026-02-16 | technical-writer | 3개 문서 통합 (feasibility, reevaluation, summary) |

---

**작성자**: project-manager, technical-writer
**검토자**: 사용자 승인 필요
**다음 단계**: Phase 4 완료 후 Task 7.0 (POC) 시작
