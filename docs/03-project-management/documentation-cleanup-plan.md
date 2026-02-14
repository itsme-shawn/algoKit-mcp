# 프로젝트 문서 정리 계획

**작성일**: 2026-02-15
**담당**: project-manager
**상태**: 승인 대기
**목적**: 문서 중복 제거, 구조 개선, 유지보수성 향상

---

## 목차

1. [현황 분석](#현황-분석)
2. [정리 목표 및 효과](#정리-목표-및-효과)
3. [정리 대상 분석](#정리-대상-분석)
4. [정리 옵션](#정리-옵션)
5. [실행 계획](#실행-계획)
6. [롤백 계획](#롤백-계획)

---

## 현황 분석

### 📊 문서 통계 (2026-02-15 기준)

```
총 문서: 34개 + 4개 (마케팅)
├── 01-planning/: 8개
├── 02-development/: 5개
├── 03-project-management/: 2개
├── 04-testing/: 13개
├── 05-marketing/: 4개
└── 루트: 2개 (INDEX.md, CONTRIBUTING.md)
```

### 🔍 문제점

#### 1. 중복 문서 (8개)
- **Programmers 관련 3개**: feasibility → reevaluation → summary (1,225줄)
- **Rate Limiting 2개**: design + implementation (설계와 구현 분리)
- **LRU Caching 2개**: design + implementation (설계와 구현 분리)
- **Web Scraping 3개**: policy-review + policy + user-agent-implementation

#### 2. 불필요한 문서 (1개)
- **rename-plan.md**: 프로젝트명 변경 계획 (실행 완료, 보관 불필요)

#### 3. 테스트 문서 파편화 (4개 중복)
- `03-results-phase3-red.md` (Red Phase 중간 결과 → 최종 결과에 포함됨)
- `test-results-phase3-keyless.md` (중간 결과 → 최종 결과에 포함됨)

#### 4. 마케팅 문서 혼재 (4개)
- `landing-page.html` (빌드 산출물, 소스 코드 아님)
- `landing-page-pro.astro` (빌드 산출물, 소스 코드 아님)

### 🎯 개선 필요 영역

1. **문서 통합**: 설계 + 구현 + 정책을 하나로
2. **폴더 재구성**: Phase별 테스트 문서 그룹화
3. **INDEX.md 최신화**: 통합/삭제된 문서 반영
4. **아카이빙**: 중간 산출물 보관

---

## 정리 목표 및 효과

### 목표

1. **중복 제거**: 8개 문서 → 3개로 통합 (62% 감소)
2. **구조 개선**: Phase별 폴더 그룹화
3. **링크 정리**: INDEX.md 및 상호 참조 업데이트
4. **가독성 향상**: 문서 탐색 시간 50% 단축

### 예상 효과

| 항목 | 현재 | 정리 후 | 개선율 |
|------|------|---------|--------|
| **문서 수** | 34개 | 25개 | -26% |
| **중복 문서** | 8개 | 0개 | -100% |
| **폴더 깊이** | 2-3단계 | 2단계 | 개선 |
| **탐색 시간** | ~5분 | ~2분 | -60% |

---

## 정리 대상 분석

### 🗑️ 삭제 대상

#### 1. 실행 완료된 계획 문서 (1개)
```
docs/03-project-management/
└── rename-plan.md (불필요, 이미 실행 완료)
```

**이유**: 프로젝트명 변경이 이미 완료되어 참고 가치 없음.

---

### 🔄 통합 대상

#### 1. Programmers 통합 (3개 → 1개)

**삭제**:
```
docs/01-planning/
├── programmers-integration-feasibility.md (406줄, 보수적 평가)
└── programmers-integration-reevaluation.md (552줄, Playwright 검증)
```

**유지**:
```
docs/01-planning/
└── programmers-integration-summary.md (267줄, 최종 결론)
```

**이유**:
- `summary.md`가 최종 의사결정 지원 문서로 두 문서의 핵심 내용 포함
- 최초 분석과 재평가 과정은 요약 내 "분석 과정" 섹션에 포함됨
- **삭제 예상 절감**: 958줄 (78% 감소)

---

#### 2. Rate Limiting (2개 → 1개)

**통합**:
```
docs/01-planning/rate-limiting-design.md
+
docs/02-development/rate-limiting-implementation.md
↓
docs/02-development/rate-limiting.md
```

**새 구조**:
```markdown
# Rate Limiting 가이드 (설계 + 구현)

## 1. 설계 (Design)
- 문제 정의
- Token Bucket 알고리즘
- 클래스 설계

## 2. 구현 (Implementation)
- 코드 예제
- API 통합
- 테스트 코드

## 3. 검증 (Verification)
- test-spec-phase4-2.md 참조
```

**이유**:
- 설계와 구현이 긴밀히 연결되어 하나로 보는 것이 이해에 유리
- 개발자가 설계 → 구현을 한 문서에서 추적 가능
- 불필요한 파일 전환 감소

---

#### 3. LRU Caching (2개 → 1개)

**통합**:
```
docs/01-planning/lru-caching-design.md
+
docs/02-development/lru-caching-implementation.md
↓
docs/02-development/lru-caching.md
```

**새 구조** (Rate Limiting과 동일):
```markdown
# LRU Caching 가이드 (설계 + 구현)

## 1. 설계 (Design)
## 2. 구현 (Implementation)
## 3. 검증 (Verification)
```

---

#### 4. Web Scraping (3개 → 1개)

**통합**:
```
docs/01-planning/web-scraping-policy-review.md (정책 검토)
+
docs/02-development/web-scraping-policy.md (정책 가이드)
+
docs/02-development/user-agent-implementation.md (User-Agent 구현)
↓
docs/02-development/web-scraping-guide.md
```

**새 구조**:
```markdown
# Web Scraping 가이드 (정책 + 구현)

## 1. 정책 (Policy)
- robots.txt 준수
- Rate Limiting
- 법적 고려사항

## 2. BOJ 스크래핑 구현
- BeautifulSoup4 사용
- 3초 간격 설정
- User-Agent 설정

## 3. 향후 확장 (Programmers)
- Puppeteer 기반 스크래핑
- SPA 렌더링 처리
```

**이유**:
- 정책 + 구현을 함께 보는 것이 윤리적 스크래핑 이해에 도움
- User-Agent 구현도 정책의 일부로 통합
- 확장 계획(Programmers)도 같이 관리

---

### 📦 아카이빙 대상

#### 테스트 중간 결과 (2개)

**아카이빙**:
```
docs/04-testing/
├── 03-results-phase3-red.md → archive/03-results-phase3-red.md
└── test-results-phase3-keyless.md → archive/test-results-phase3-keyless.md
```

**이유**:
- 최종 결과(`03-results-phase3.md`)에 포함됨
- 삭제하기에는 개발 과정 기록 가치 있음
- `archive/` 폴더로 이동하여 보관

---

### ✅ 유지 대상

#### 핵심 문서
```
docs/
├── INDEX.md (네비게이션)
├── CONTRIBUTING.md (작성 규칙)
├── 01-planning/
│   ├── PRD.md (제품 요구사항)
│   ├── SRS.md (시스템 요구사항)
│   └── programmers-integration-summary.md (통합 후)
├── 02-development/
│   ├── ARCHITECTURE.md
│   ├── EXTERNAL_API.md
│   ├── TOOLS.md
│   ├── rate-limiting.md (통합)
│   ├── lru-caching.md (통합)
│   └── web-scraping-guide.md (통합)
├── 03-project-management/
│   └── TASKS.md
└── 04-testing/
    ├── README.md
    ├── archive/ (신규)
    ├── phase-1/
    ├── phase-2/
    ├── phase-3/
    └── phase-4/
```

---

## 정리 옵션

### Option A: 최소 정리 (30분)

**대상**: 불필요한 문서만 삭제

**작업**:
1. `rename-plan.md` 삭제
2. Programmers 3개 → 1개 (summary만 유지)
3. INDEX.md 링크 업데이트

**효과**:
- 문서 4개 감소 (34개 → 30개)
- 중복 3개 제거
- 링크 오류 수정

**추천 대상**: 시간이 제한적이고 최소한의 정리만 원할 때

---

### Option B: 권장 정리 (2시간) ✅ 추천

**대상**: 중복 문서 통합 + 폴더 재구성

**작업**:
1. **Phase 1: 문서 통합** (1시간)
   - Programmers 3개 → 1개
   - Rate Limiting 2개 → 1개
   - LRU Caching 2개 → 1개
   - Web Scraping 3개 → 1개
   - rename-plan.md 삭제

2. **Phase 2: 폴더 재구성** (30분)
   - 테스트 문서 Phase별 그룹화
   - archive/ 폴더 생성 및 중간 결과 이동

3. **Phase 3: 링크 정리** (30분)
   - INDEX.md 완전 재작성
   - CLAUDE.md 링크 업데이트
   - README.md 링크 업데이트

**효과**:
- 문서 9개 감소 (34개 → 25개, -26%)
- 중복 8개 제거
- 폴더 구조 개선 (Phase별 그룹화)
- 탐색 시간 60% 단축

**추천 대상**: 프로젝트 문서 장기 유지보수성 개선 원할 때

---

### Option C: 완전 정리 (4시간)

**대상**: Option B + 문서 내용 개선

**작업**:
1. **Option B 모든 작업**
2. **Phase 4: 문서 내용 개선** (2시간)
   - 제목 계층 구조 통일 (# ## ### 균형)
   - 목차 누락 문서 목차 추가
   - 섹션 번호매기기 일관성 확인
   - 코드 블록 언어 명시 (```typescript, ```bash)
   - 표 형식 통일

**효과**:
- Option B 효과 전부
- 문서 품질 향상
- 일관성 개선
- 신규 팀원 온보딩 시간 단축

**추천 대상**: 문서 품질까지 완벽하게 개선하고 싶을 때

---

## 실행 계획 (Option B 기준)

### Phase 1: 문서 통합 (1시간)

#### Task 1-1: Programmers 통합 (10분)
```bash
# 삭제
rm docs/01-planning/programmers-integration-feasibility.md
rm docs/01-planning/programmers-integration-reevaluation.md

# 유지 (변경 없음)
# docs/01-planning/programmers-integration-summary.md
```

#### Task 1-2: 개발 정책 통합 (30분)

**Rate Limiting**:
```bash
# 1. 새 파일 생성 (design + implementation 병합)
# docs/02-development/rate-limiting.md

# 2. 기존 파일 삭제
rm docs/01-planning/rate-limiting-design.md
rm docs/02-development/rate-limiting-implementation.md
```

**LRU Caching** (동일 패턴):
```bash
# 새 파일: docs/02-development/lru-caching.md
rm docs/01-planning/lru-caching-design.md
rm docs/02-development/lru-caching-implementation.md
```

**Web Scraping**:
```bash
# 새 파일: docs/02-development/web-scraping-guide.md
rm docs/01-planning/web-scraping-policy-review.md
rm docs/02-development/web-scraping-policy.md
rm docs/02-development/user-agent-implementation.md
```

#### Task 1-3: 불필요한 문서 삭제 (5분)
```bash
rm docs/03-project-management/rename-plan.md
```

---

### Phase 2: 폴더 재구성 (30분)

#### Task 2-1: 테스트 문서 Phase별 그룹화 (20분)

```bash
# 1. Phase별 폴더 생성
mkdir -p docs/04-testing/phase-1
mkdir -p docs/04-testing/phase-2
mkdir -p docs/04-testing/phase-3
mkdir -p docs/04-testing/phase-4
mkdir -p docs/04-testing/archive

# 2. 파일 이동
# Phase 1
mv docs/04-testing/01-spec-phase1.md docs/04-testing/phase-1/spec.md
mv docs/04-testing/01-results-phase1.md docs/04-testing/phase-1/results.md

# Phase 2
mv docs/04-testing/02-spec-phase2.md docs/04-testing/phase-2/spec.md
mv docs/04-testing/02-results-phase2.md docs/04-testing/phase-2/results.md

# Phase 3
mv docs/04-testing/03-spec-phase3.md docs/04-testing/phase-3/spec.md
mv docs/04-testing/03-results-phase3.md docs/04-testing/phase-3/results.md

# Phase 4
mv docs/04-testing/test-spec-phase4-2.md docs/04-testing/phase-4/spec-rate-limiting.md
mv docs/04-testing/test-spec-phase4-4.md docs/04-testing/phase-4/spec-lru-caching.md

# Archive (중간 결과)
mv docs/04-testing/03-results-phase3-red.md docs/04-testing/archive/
mv docs/04-testing/test-results-phase3-keyless.md docs/04-testing/archive/

# 기타 문서 유지 (루트)
# - README.md
# - coverage-recovery-report.md
# - e2e-manual-test-guide.md
```

#### Task 2-2: 마케팅 문서 재배치 검토 (10분)

**현황**:
```
docs/05-marketing/
├── branding-guide.md (유지)
├── landing-page-content.md (유지)
├── landing-page-pro.astro (빌드 산출물)
└── landing-page.html (빌드 산출물)
```

**권장사항**:
```bash
# 옵션 1: 빌드 산출물 삭제
rm docs/05-marketing/landing-page-pro.astro
rm docs/05-marketing/landing-page.html

# 옵션 2: 별도 폴더로 이동
mkdir -p marketing-assets/
mv docs/05-marketing/landing-page-pro.astro marketing-assets/
mv docs/05-marketing/landing-page.html marketing-assets/
```

---

### Phase 3: 링크 정리 (30분)

#### Task 3-1: INDEX.md 완전 재작성 (20분)

**업데이트 내용**:
1. 통합된 문서 링크 수정
   - `rate-limiting-design.md` + `rate-limiting-implementation.md` → `rate-limiting.md`
   - `lru-caching-design.md` + `lru-caching-implementation.md` → `lru-caching.md`
   - `web-scraping-*` → `web-scraping-guide.md`
2. 삭제된 문서 제거
   - Programmers 2개 삭제
   - rename-plan.md 삭제
3. Phase별 폴더 구조 반영
   - `phase-1/spec.md`, `phase-1/results.md`
4. 마지막 업데이트 날짜: 2026-02-15

#### Task 3-2: 상호 참조 업데이트 (10분)

**수정 대상**:
1. **CLAUDE.md**
   - 문서 링크 업데이트 (Rate Limiting, LRU Caching 등)
2. **README.md**
   - 문서 링크 업데이트
3. **각 통합 문서 내부**
   - 상호 참조 링크 업데이트

---

### Phase 4: 최종 검증 (10분)

#### Task 4-1: 링크 유효성 확인 (5분)

```bash
# 깨진 링크 찾기 (수동 검증)
grep -r "]\(" docs/*.md docs/**/*.md | grep -E "(rate-limiting|lru-caching|web-scraping|programmers-integration)"
```

#### Task 4-2: 문서 완전성 확인 (5분)

**체크리스트**:
- [ ] 모든 .md 파일이 INDEX.md에 나열되어 있는가?
- [ ] 삭제되지 않아야 할 파일이 삭제되지 않았는가?
- [ ] 통합된 문서가 완전한가? (목차, 섹션 누락 없음)
- [ ] Phase별 폴더에 파일이 올바르게 이동되었는가?

---

## 산출물

### 1. 정리 계획 문서 (이 문서)
**파일**: `docs/03-project-management/documentation-cleanup-plan.md`

### 2. 통합 가이드
**파일**: `docs/03-project-management/document-organization-guide.md`

**내용**:
- 문서 명명 규칙
- 폴더 구조 규칙
- 문서 통합 원칙 (설계 + 구현 병합)
- 문서 추가/삭제 절차
- 아카이빙 기준

### 3. 실행 결과 보고서
**파일**: `.claude/qa-reports/documentation-cleanup-report.md`

**내용**:
- 삭제된 파일 목록
- 통합된 문서 목록
- 링크 수정 현황
- 최종 문서 트리
- Before/After 비교

---

## 롤백 계획

### Git 활용

**작업 전**:
```bash
# 현재 상태 커밋 (변경 전 스냅샷)
git add docs/
git commit -m "[docs] 문서 정리 전 스냅샷"
```

**롤백 방법**:
```bash
# 변경 취소
git reset --hard HEAD~1
```

### 수동 복구

만약 Git이 아닌 수동으로 롤백해야 할 경우:

1. **삭제된 파일 복구**:
   - Git history에서 파일 내용 복구
   - `git show HEAD~1:docs/path/to/file.md > docs/path/to/file.md`

2. **통합된 문서 분리**:
   - 통합 전 파일 복구
   - 통합 파일 삭제

3. **폴더 구조 복원**:
   - Phase별 폴더에서 파일을 루트로 이동
   - 폴더 삭제

---

## 인수 조건 (Acceptance Criteria)

### Option A: 최소 정리
- [ ] rename-plan.md 삭제 완료
- [ ] Programmers 문서 2개 삭제 완료
- [ ] INDEX.md 링크 업데이트 완료
- [ ] 링크 오류 0개

### Option B: 권장 정리 ✅
- [ ] 문서 9개 감소 (34개 → 25개)
- [ ] 중복 문서 8개 제거
- [ ] Phase별 폴더 구조 완성
- [ ] INDEX.md 완전 재작성
- [ ] 링크 오류 0개
- [ ] 통합 가이드 문서 작성
- [ ] 실행 결과 보고서 작성

### Option C: 완전 정리
- [ ] Option B 모든 조건
- [ ] 문서 제목 계층 통일
- [ ] 목차 누락 0개
- [ ] 코드 블록 언어 명시 100%
- [ ] 표 형식 통일

---

## 다음 단계

### 즉시 (사용자 승인 필요)
1. **정리 옵션 선택**: A / B / C 중 선택
2. **승인 확인**: 문서 통합 및 삭제 승인

### 승인 후
3. **Phase 1 실행**: 문서 통합 (1시간)
4. **Phase 2 실행**: 폴더 재구성 (30분)
5. **Phase 3 실행**: 링크 정리 (30분)
6. **Phase 4 실행**: 최종 검증 (10분)

### 완료 후
7. **결과 보고**: 실행 결과 보고서 작성
8. **커밋 계획**: `/gitcommit` 명령으로 커밋 계획 작성

---

## 예상 소요 시간

| 옵션 | 계획 수립 | 실행 | 검증 | 총합 |
|------|----------|------|------|------|
| **Option A** | 완료 | 30분 | 10분 | 40분 |
| **Option B** (추천) | 완료 | 2시간 | 10분 | 2시간 10분 |
| **Option C** | 완료 | 4시간 | 20분 | 4시간 20분 |

---

## 권장사항

**추천 옵션**: **Option B (권장 정리)**

**이유**:
1. 중복 문서 완전 제거 (8개 → 0개)
2. 폴더 구조 개선으로 장기 유지보수성 향상
3. 2시간으로 실용적인 시간 투자
4. 문서 탐색 시간 60% 단축
5. 신규 팀원 온보딩 개선

**진행 방식**:
- Phase별 순차 실행
- 각 Phase 완료 후 검증
- 문제 발생 시 즉시 롤백 가능

---

**작성자**: project-manager
**검토자**: 사용자 승인 필요
**다음 단계**: 정리 옵션 선택 및 승인
