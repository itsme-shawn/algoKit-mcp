# 문서 조직화 가이드

**작성일**: 2026-02-15
**담당**: project-manager
**상태**: 승인됨
**목적**: 프로젝트 문서의 장기 유지보수 및 일관성 유지

---

## 목차

1. [문서 조직 원칙](#문서-조직-원칙)
2. [폴더 구조 규칙](#폴더-구조-규칙)
3. [파일 명명 규칙](#파일-명명-규칙)
4. [문서 통합 전략](#문서-통합-전략)
5. [문서 추가 절차](#문서-추가-절차)
6. [문서 삭제 절차](#문서-삭제-절차)
7. [아카이빙 기준](#아카이빙-기준)
8. [링크 관리](#링크-관리)

---

## 문서 조직 원칙

### 1. 단일 진실의 원천 (Single Source of Truth)

**원칙**: 동일한 정보는 한 곳에만 존재해야 함.

**나쁜 예** ❌:
```
docs/01-planning/rate-limiting-design.md (설계)
docs/02-development/rate-limiting-implementation.md (구현)
→ 동일한 알고리즘 설명이 두 문서에 중복
```

**좋은 예** ✅:
```
docs/02-development/rate-limiting.md (설계 + 구현 통합)
→ 알고리즘 설명은 한 곳에만 존재
```

---

### 2. 정보 계층화 (Information Hierarchy)

**원칙**: 요약 → 상세 → 참조 순서로 정보 구조화.

**문서 계층**:
1. **Level 1**: 요약/개요 문서 (Summary, INDEX.md)
2. **Level 2**: 상세 가이드 (ARCHITECTURE.md, rate-limiting.md)
3. **Level 3**: 참조 문서 (test specs, API docs)

**예시**:
```
Level 1: programmers-integration-summary.md (최종 결론)
  ├─ Level 2: 분석 과정 요약 (feasibility, reevaluation 내용 포함)
  └─ Level 3: 테스트 스크립트, POC 코드 (별도 파일)
```

---

### 3. 생명주기 관리 (Lifecycle Management)

**문서 상태**:
- **활성 (Active)**: 현재 프로젝트에서 참조됨
- **아카이브 (Archived)**: 과거 기록, 참고용
- **삭제 (Deleted)**: 가치 없음, 제거

**규칙**:
- 중간 산출물 → 아카이브
- 실행 완료된 계획 → 삭제
- 최종 결과 → 활성

---

## 폴더 구조 규칙

### 표준 폴더 구조

```
docs/
├── INDEX.md                      # 문서 네비게이션
├── CONTRIBUTING.md               # 문서 작성 규칙
│
├── 01-planning/                  # 기획 및 설계
│   ├── PRD.md                   # 제품 요구사항 (Level 1)
│   ├── SRS.md                   # 시스템 요구사항 (Level 2)
│   └── *-summary.md             # 분석 요약 문서
│
├── 02-development/               # 개발 가이드 (설계 + 구현 통합)
│   ├── ARCHITECTURE.md          # 아키텍처
│   ├── EXTERNAL_API.md          # 외부 API
│   ├── TOOLS.md                 # MCP 도구
│   └── <feature>.md             # 기능별 가이드 (설계 + 구현)
│
├── 03-project-management/        # 프로젝트 관리
│   ├── TASKS.md                 # 태스크 관리 (활성)
│   └── *-plan.md                # 계획 문서
│
├── 04-testing/                   # 테스트 문서
│   ├── README.md                # 테스트 가이드
│   ├── phase-<N>/               # Phase별 폴더
│   │   ├── spec.md             # 테스트 스펙
│   │   └── results.md          # 테스트 결과
│   ├── archive/                 # 중간 결과 아카이브
│   └── *.md                     # 공통 가이드
│
└── 05-marketing/                 # 마케팅 자료
    ├── branding-guide.md
    └── landing-page-content.md
```

---

### 폴더 규칙

#### 01-planning/ (기획 및 설계)

**용도**: 프로젝트 초기 기획, 요구사항, 아키텍처 설계

**포함**:
- PRD.md, SRS.md (핵심 문서)
- 실현가능성 분석 요약 (*-summary.md)
- 아키텍처 설계

**제외**:
- ❌ 구현 가이드 (02-development로 이동)
- ❌ 실행 완료된 계획 (삭제 또는 아카이브)

---

#### 02-development/ (개발 가이드)

**용도**: 개발자가 기능을 구현할 때 참조하는 가이드

**명명 규칙**:
- `<feature>.md` (단일 파일, 설계 + 구현 통합)
- 예: `rate-limiting.md`, `lru-caching.md`, `web-scraping-guide.md`

**문서 구조** (템플릿):
```markdown
# <Feature Name> 가이드

## 1. 설계 (Design)
- 문제 정의
- 요구사항
- 알고리즘/아키텍처 선택

## 2. 구현 (Implementation)
- 코드 예제
- API 통합
- 파일 구조

## 3. 검증 (Verification)
- 테스트 방법
- 커버리지 기준
- 참조: docs/04-testing/phase-<N>/spec.md
```

**장점**:
- 설계 → 구현을 한 문서에서 추적
- 파일 전환 없이 전체 맥락 파악
- 유지보수 시 일관성 유지

---

#### 03-project-management/ (프로젝트 관리)

**용도**: 진행 상황, 태스크, 계획 관리

**포함**:
- TASKS.md (항상 최신)
- 진행 중인 계획 (*-plan.md)

**제외**:
- ❌ 실행 완료된 계획 (삭제)

---

#### 04-testing/ (테스트 문서)

**폴더 구조**:
```
04-testing/
├── README.md                     # 테스트 가이드
├── phase-1/
│   ├── spec.md                  # 테스트 스펙
│   └── results.md               # 최종 결과
├── phase-2/
│   ├── spec.md
│   └── results.md
├── phase-<N>/                    # Phase별 폴더
│   ├── spec.md
│   ├── results.md
│   └── spec-<sub-feature>.md    # 서브 기능 스펙 (필요시)
├── archive/                      # 중간 결과 아카이브
│   ├── phase-3-red.md
│   └── phase-3-keyless.md
├── coverage-recovery-report.md   # 공통 리포트
└── e2e-manual-test-guide.md      # 공통 가이드
```

**명명 규칙**:
- Phase 폴더: `phase-<N>/`
- 스펙: `spec.md` (단일) 또는 `spec-<feature>.md` (서브 기능)
- 결과: `results.md` (최종 결과만)

**아카이빙 규칙**:
- 중간 결과 → `archive/`
- Red/Green/Refactor 중간 단계 → `archive/`
- 최종 결과 → `phase-<N>/results.md`

---

## 파일 명명 규칙

### 기본 규칙

1. **형식**: `kebab-case.md` (소문자, 하이픈)
2. **언어**: 영어 (한글 파일명 금지)
3. **확장자**: `.md` (Markdown)

---

### 명명 패턴

| 문서 유형 | 패턴 | 예시 |
|----------|------|------|
| **제품 요구사항** | `PRD.md` | PRD.md |
| **시스템 요구사항** | `SRS.md` | SRS.md |
| **아키텍처** | `ARCHITECTURE.md` | ARCHITECTURE.md |
| **기능 가이드** (통합) | `<feature>.md` | rate-limiting.md |
| **분석 요약** | `<topic>-summary.md` | programmers-integration-summary.md |
| **태스크 관리** | `TASKS.md` | TASKS.md |
| **테스트 스펙** | `spec.md` 또는 `spec-<feature>.md` | spec.md, spec-rate-limiting.md |
| **테스트 결과** | `results.md` | results.md |
| **인덱스** | `INDEX.md` | INDEX.md |

---

### 특수 케이스

#### 1. 대문자 파일명 (ALL CAPS)

**사용 케이스**:
- 프로젝트 루트 레벨 중요 문서
- 표준 문서명 (PRD, SRS, README 등)

**예시**:
- ✅ `INDEX.md`, `CONTRIBUTING.md`, `TASKS.md`
- ✅ `PRD.md`, `SRS.md`, `ARCHITECTURE.md`

---

#### 2. 접두사 규칙

**Phase 번호 접두사** (폴더명에만 사용):
- `phase-1/`, `phase-2/`, ...
- 파일명에는 접두사 제거 (`spec.md`, `results.md`)

**시간 기반 접두사** (아카이브):
- `YYYYMMDD-<description>.md`
- 예: `20260215-phase3-red.md`

---

## 문서 통합 전략

### 언제 통합할까?

**통합 조건**:
1. 두 문서가 동일한 기능/주제를 다룸
2. 독자가 동일함 (개발자 → 개발자)
3. 참조 관계가 강함 (설계 → 구현)

**예시**:
- ✅ `rate-limiting-design.md` + `rate-limiting-implementation.md` → `rate-limiting.md`
- ✅ `web-scraping-policy.md` + `user-agent-implementation.md` → `web-scraping-guide.md`

---

### 통합 방법

#### 템플릿 (설계 + 구현 통합)

```markdown
# <Feature Name> 가이드

**작성일**: YYYY-MM-DD
**마지막 업데이트**: YYYY-MM-DD

---

## 목차
1. [설계](#설계)
2. [구현](#구현)
3. [검증](#검증)

---

## 1. 설계 (Design)

### 1.1 문제 정의
### 1.2 요구사항
### 1.3 알고리즘 선택
### 1.4 클래스 설계

---

## 2. 구현 (Implementation)

### 2.1 코드 구조
### 2.2 API 통합
### 2.3 예제 코드

---

## 3. 검증 (Verification)

### 3.1 테스트 방법
### 3.2 커버리지 기준
### 3.3 참조 문서
- [테스트 스펙](../04-testing/phase-4/spec-<feature>.md)
```

---

### 통합 체크리스트

통합 시 확인 사항:
- [ ] 두 문서의 내용이 완전히 병합되었는가?
- [ ] 중복된 섹션이 제거되었는가?
- [ ] 참조 링크가 업데이트되었는가?
- [ ] 목차가 새 구조를 반영하는가?
- [ ] 마지막 업데이트 날짜가 변경되었는가?

---

## 문서 추가 절차

### 새 문서 추가 시

#### Step 1: 폴더 선택
```
기획/설계 → 01-planning/
개발 가이드 → 02-development/
프로젝트 관리 → 03-project-management/
테스트 → 04-testing/phase-<N>/
마케팅 → 05-marketing/
```

#### Step 2: 파일명 결정
- 명명 규칙 준수 (kebab-case.md)
- 기존 파일과 중복 확인

#### Step 3: 문서 작성
- 템플릿 사용 (CONTRIBUTING.md 참조)
- 헤더 포함 (제목, 작성일, 상태 등)
- 목차 추가

#### Step 4: INDEX.md 업데이트
- 새 문서를 INDEX.md에 추가
- 섹션, 설명, 링크 포함

#### Step 5: 링크 검증
- 내부 링크 유효성 확인
- 상호 참조 업데이트

---

### 예시: 새 기능 가이드 추가

**시나리오**: Logging 기능 가이드 추가

```bash
# 1. 파일 생성
touch docs/02-development/logging.md

# 2. 문서 작성 (템플릿 사용)
# 설계 + 구현 통합 구조

# 3. INDEX.md 업데이트
# 🛠️ 2. 개발 가이드 섹션에 추가:
# ### [logging.md](02-development/logging.md)
# - **제목**: 로깅 가이드
# - **대상 독자**: 백엔드 개발자
# - **목적**: 구조화된 로깅 및 모니터링 구현

# 4. CLAUDE.md 업데이트 (필요시)
# 프로젝트 구조 섹션에 logging.md 언급
```

---

## 문서 삭제 절차

### 삭제 조건

**즉시 삭제**:
1. 실행 완료된 계획 문서 (예: rename-plan.md)
2. 중복 문서 (통합 완료 후)
3. 오래된 초안 (미완성 문서)

**아카이빙**:
1. 중간 산출물 (Red Phase 결과 등)
2. 이전 버전 문서 (참고 가치 있음)
3. 실험 결과 (POC 등)

---

### 삭제 절차

#### Step 1: 삭제 가능 여부 확인
```
❓ 이 문서가 다른 곳에서 참조되는가?
❓ 이 문서가 유일한 정보 출처인가?
❓ 향후 참고할 가치가 있는가?
```

#### Step 2: 참조 제거
```bash
# 다른 문서에서 이 문서 링크 검색
grep -r "deleted-file.md" docs/
```

#### Step 3: INDEX.md 업데이트
- 삭제된 문서 항목 제거

#### Step 4: 삭제 실행
```bash
# 즉시 삭제
rm docs/path/to/deleted-file.md

# 또는 아카이빙
mv docs/path/to/file.md docs/04-testing/archive/
```

#### Step 5: 커밋
```bash
git add docs/
git commit -m "[docs] <file.md> 삭제 (이유)"
```

---

## 아카이빙 기준

### 아카이빙 대상

| 문서 유형 | 아카이빙 조건 | 보관 위치 |
|----------|--------------|----------|
| **테스트 중간 결과** | 최종 결과에 포함됨 | `docs/04-testing/archive/` |
| **실험 결과 (POC)** | 실험 완료, 참고 가치 있음 | `docs/01-planning/archive/` (신규) |
| **이전 버전 문서** | 새 버전으로 대체됨 | 각 폴더 내 `archive/` |

---

### 아카이빙 절차

```bash
# 1. archive/ 폴더 생성 (없으면)
mkdir -p docs/04-testing/archive

# 2. 파일 이동
mv docs/04-testing/03-results-phase3-red.md docs/04-testing/archive/

# 3. INDEX.md에서 제거 (또는 아카이브 섹션 추가)
# 아카이브 문서는 INDEX.md에 나열하지 않음

# 4. 커밋
git add docs/
git commit -m "[docs] Phase 3 중간 결과 아카이빙"
```

---

## 링크 관리

### 링크 작성 규칙

#### 1. 상대 경로 사용 (필수)

**나쁜 예** ❌:
```markdown
[PRD](/docs/01-planning/PRD.md)
```

**좋은 예** ✅:
```markdown
# docs/02-development/architecture.md에서
[PRD](../01-planning/PRD.md)

# docs/INDEX.md에서
[PRD](01-planning/PRD.md)
```

---

#### 2. 앵커 링크 (섹션 참조)

**형식**:
```markdown
[링크 텍스트](파일경로#섹션-id)
```

**예시**:
```markdown
[Rate Limiting 설계](../02-development/rate-limiting.md#설계)
[테스트 스펙](../04-testing/phase-1/spec.md#edge-cases)
```

**섹션 ID 규칙**:
- 공백 → 하이픈 (`-`)
- 소문자 변환
- 특수문자 제거

---

#### 3. 외부 링크 (새 탭)

**문서 내 링크**: 상대 경로
**외부 링크**: 절대 URL

```markdown
# 문서 내 링크
[테스트 가이드](../04-testing/README.md)

# 외부 링크
[Puppeteer 공식 문서](https://pptr.dev/)
```

---

### 링크 검증 방법

#### 수동 검증

```bash
# 깨진 링크 찾기
grep -r "]\(" docs/*.md docs/**/*.md

# 특정 파일 참조 찾기
grep -r "deleted-file.md" docs/
```

#### 자동 검증 (권장)

**markdownlint-cli** 사용:
```bash
npm install -g markdownlint-cli

# 링크 유효성 검사
markdownlint docs/**/*.md
```

---

### 링크 업데이트 시나리오

#### 시나리오 1: 파일명 변경

**변경**:
```
rate-limiting-design.md → rate-limiting.md
```

**업데이트 필요**:
1. INDEX.md
2. CLAUDE.md
3. 다른 문서의 참조 링크

**검색 명령**:
```bash
grep -r "rate-limiting-design.md" docs/
```

---

#### 시나리오 2: 폴더 구조 변경

**변경**:
```
docs/04-testing/01-spec-phase1.md
→
docs/04-testing/phase-1/spec.md
```

**업데이트 필요**:
1. INDEX.md
2. 다른 테스트 문서의 참조

---

## 정기 점검 절차

### 월간 점검 (권장)

**체크리스트**:
- [ ] INDEX.md가 모든 활성 문서를 포함하는가?
- [ ] 깨진 링크가 있는가?
- [ ] 6개월 이상 업데이트 안 된 문서는?
- [ ] 중복 문서가 생성되었는가?
- [ ] 아카이빙 대상 문서는?

---

### 분기별 점검 (선택)

**심층 점검**:
- 문서 품질 리뷰
- 목차 및 구조 일관성
- 코드 예제 유효성
- 용어 통일성

---

## 예시: 실제 정리 케이스

### Case 1: Programmers 통합 문서 정리

**Before**:
```
docs/01-planning/
├── programmers-integration-feasibility.md (406줄, 보수적 평가)
├── programmers-integration-reevaluation.md (552줄, Playwright 검증)
└── programmers-integration-summary.md (267줄, 최종 결론)
```

**문제**:
- 3개 문서가 동일 주제 다룸
- 순차적으로 작성되어 중복 내용 많음
- 독자가 어떤 문서를 읽어야 할지 혼란

**After**:
```
docs/01-planning/
└── programmers-integration-summary.md (267줄, 최종 결론)
    ├─ 1단계: 최초 분석 (요약)
    ├─ 2단계: 재평가 (요약)
    └─ 최종 결론 (상세)
```

**적용 원칙**:
- ✅ 단일 진실의 원천 (SSOT)
- ✅ 정보 계층화 (요약 → 상세)
- ✅ 생명주기 관리 (중복 문서 삭제)

---

### Case 2: Rate Limiting 통합

**Before**:
```
docs/01-planning/rate-limiting-design.md (설계)
docs/02-development/rate-limiting-implementation.md (구현)
```

**문제**:
- 개발자가 설계 → 구현을 파악하려면 2개 파일 전환
- Token Bucket 알고리즘 설명이 두 곳에 중복

**After**:
```
docs/02-development/rate-limiting.md (설계 + 구현 통합)
```

**구조**:
```markdown
# Rate Limiting 가이드

## 1. 설계 (Design)
- Token Bucket 알고리즘 (한 번만 설명)
- 클래스 설계

## 2. 구현 (Implementation)
- 코드 예제 (설계 참조)
- API 통합

## 3. 검증
- 테스트 스펙 참조
```

**적용 원칙**:
- ✅ 단일 진실의 원천 (알고리즘 설명 한 곳에만)
- ✅ 문서 통합 전략 (설계 + 구현)

---

## 부록: 템플릿 모음

### A. 기능 가이드 템플릿 (설계 + 구현)

```markdown
# <Feature Name> 가이드

**작성일**: YYYY-MM-DD
**마지막 업데이트**: YYYY-MM-DD
**담당**: <에이전트명>

---

## 목차
1. [설계](#설계)
2. [구현](#구현)
3. [검증](#검증)

---

## 1. 설계 (Design)

### 1.1 문제 정의
- 해결하려는 문제
- 요구사항

### 1.2 알고리즘/아키텍처 선택
- 선택한 알고리즘/아키텍처
- 선택 이유 (Tradeoffs)

### 1.3 클래스/모듈 설계
- 클래스 다이어그램
- 인터페이스 정의

---

## 2. 구현 (Implementation)

### 2.1 코드 구조
- 파일 위치
- 디렉토리 구조

### 2.2 핵심 코드
```typescript
// 예제 코드
```

### 2.3 API 통합
- 사용 방법
- 설정 방법

---

## 3. 검증 (Verification)

### 3.1 테스트 방법
- 단위 테스트
- 통합 테스트

### 3.2 커버리지 기준
- 목표: XX%
- 핵심 경로: 100%

### 3.3 참조 문서
- [테스트 스펙](../04-testing/phase-<N>/spec-<feature>.md)
```

---

### B. 분석 요약 템플릿

```markdown
# <Topic> 분석 요약

**작성일**: YYYY-MM-DD
**담당**: <에이전트명>
**상태**: ✅ 완료 | 🚧 진행 중

---

## 📊 분석 과정

### 1단계: <단계명>
**문서**: <파일명>
**결론**: <결론>
**주요 발견**:
- 항목 1
- 항목 2

### 2단계: <단계명>
...

---

## 🎯 최종 결론

### ✅ 실현 가능 | ❌ 불가능 | ⚠️ 조건부

**진행 조건** (조건부인 경우):
1. 조건 1
2. 조건 2

---

## 📈 실현가능성 점수

| 평가 항목 | 점수 | 비고 |
|----------|------|------|
| 기술적 실현 | X/10 | ... |
| 법적 리스크 | X/10 | ... |

**종합 점수**: XX/50

---

## 📅 다음 단계

1. 즉시: ...
2. 승인 후: ...
```

---

## 마치며

이 가이드는 프로젝트 문서의 장기 유지보수성을 위한 원칙과 절차를 정의합니다.

**핵심 원칙**:
1. 단일 진실의 원천 (SSOT)
2. 정보 계층화
3. 생명주기 관리

**실천 방법**:
- 새 문서 추가 시 절차 준수
- 월간 점검으로 품질 유지
- 통합 전략으로 중복 제거

**문의**:
- 문서 조직 관련: project-manager
- 문서 작성 가이드: technical-writer

---

**작성자**: project-manager
**검토자**: technical-writer
**버전**: 1.0
