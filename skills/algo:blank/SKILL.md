---
name: algo:blank
description: 완성된 알고리즘 풀이 코드를 빈칸+TODO 연습 버전으로 변환. 핵심 로직을 ____ 로 가려 직접 채워보며 복습할 수 있는 파일 생성.
---

# algo:blank - 빈칸 연습용 코드 생성

완성된 알고리즘 풀이 코드를 빈칸+TODO 연습 버전으로 변환합니다.

## 사용법

```
/algo:blank <파일경로 또는 코드>
```

**예시:**
- `/algo:blank BOJ/1000~9999/5014/5014.java` - 파일 경로 지정
- `/algo:blank` + 코드 붙여넣기 - 코드 직접 입력
- `/algo:blank 5014` - 문제번호만 입력 → 해당 폴더에서 완성 파일 탐색

## 동작 방식

1. **대상 파일 확인**: 경로 또는 코드 수신. 경로만 있으면 Read로 읽기.
2. **핵심 로직 식별**: 아래 "빈칸 대상" 기준으로 가릴 부분 선정.
3. **빈칸 + TODO 삽입**: `____` 치환 및 `// TODO` 주석 작성.
4. **저장**: 원본 파일명에 `_blank` 접미사를 붙인 파일로 저장.
   - 예: `5014.java` → `5014_blank.java`
   - 이미 `_blank` 파일이 있으면 덮어쓸지 확인.

## 빈칸 대상 기준 (중요도 순)

### 반드시 가릴 것 (핵심 알고리즘 로직)

| 대상 | 예시 (원본 → 빈칸) |
|------|---------------------|
| 자료구조 초기화 | `new LinkedList<>()` → `new ____<>()` |
| 핵심 조건문 | `if (floor == G)` → `if (floor == ____)` |
| 점화식/계산식 | `floor + U, floor - D` → `____, ____` |
| 방문 처리 | `visited[next] = true` → `visited[____] = ____` |
| BFS/DFS 큐/스택 조작 | `queue.offer(new int[]{S, 0})` → `queue.offer(new int[]{____, ____})` |
| DP 점화식 | `dp[i] = dp[i-1] + dp[i-2]` → `dp[i] = ____ + ____` |
| 반환값 | 핵심 계산 결과 반환 부분 |

### 선택적으로 가릴 것 (흐름 파악용)

| 대상 | 예시 |
|------|------|
| 범위 체크 조건 | `1 <= next && next <= F` → `1 <= next && next <= ____` |
| 초기화 값 | `dist + 1` → `dist + ____` |

### 가리지 말 것 (뼈대/구조)

- import 문
- 클래스/메서드 시그니처
- 변수명 (파라미터로 받은 값)
- 단순 출력문
- 주석 자체
- **main 블록 전체** (테스트 케이스 배열, 기댓값, PASS/FAIL 루프 포함)
  - solution 함수 바디만 빈칸 처리
  - main은 완성된 상태로 유지해야 실행해서 맞았는지 바로 확인 가능

## TODO 주석 작성 규칙

빈칸이 있는 구간 위에 `// TODO N: 설명` 형태로 작성.

```java
// TODO 1: 큐 생성 및 시작 상태 초기화
//   - int[] = {현재 층, 버튼 누른 횟수} 형태로 관리
//   - 시작 층(S) visited 처리
Queue<int[]> queue = new ____<>();
visited[S] = ____;
queue.offer(new int[]{____, ____});
```

### TODO 작성 원칙

- 번호는 코드 흐름 순서대로 (TODO 1, 2, 3 ...)
- 설명은 **무엇을 해야 하는지** (정답은 주지 않음)
- 필요하면 힌트를 들여쓰기 `//   -` 형태로 추가
- 힌트는 자료구조나 접근 방향 정도만 (구체적 코드 X)

## 출력 예시 (Java - BOJ 5014)

**원본:**

```java
Queue<int[]> queue = new LinkedList<>();
visited[S] = true;
queue.offer(new int[]{S, 0});

while (!queue.isEmpty()) {
    int[] cur = queue.poll();
    int floor = cur[0];
    int dist  = cur[1];

    if (floor == G) {
        return dist;
    }

    int[] nexts = {floor + U, floor - D};

    for (int next : nexts) {
        if (1 <= next && next <= F && !visited[next]) {
            visited[next] = true;
            queue.offer(new int[]{next, dist + 1});
        }
    }
}
```

**빈칸 버전:**

```java
// TODO 1: 큐 생성 및 시작 상태 초기화
//   - int[] = {현재 층, 버튼 누른 횟수} 형태로 관리
//   - 시작 층(S) visited 처리
Queue<int[]> queue = new ____<>();
visited[S] = ____;
queue.offer(new int[]{____, ____});

while (!queue.isEmpty()) {
    int[] cur = queue.poll();
    int floor = cur[0];
    int dist  = cur[1];

    // TODO 2: 목표 층 도달 시 버튼 횟수 반환
    if (floor == ____) {
        return ____;
    }

    // TODO 3: 다음 이동할 층 계산 (위로 +U, 아래로 -D)
    int[] nexts = {____, ____};

    for (int next : nexts) {
        // TODO 4: 유효 범위(1 ~ F) & 미방문 체크 후 큐에 추가
        if (1 <= next && next <= ____ && !visited[____]) {
            visited[____] = ____;
            queue.offer(new int[]{____, ____});
        }
    }
}
```

## Python 빈칸 표기

Python도 동일하게 `____` 사용. 주석은 `# TODO N: 설명` 형태.

```python
# TODO 1: 큐 초기화 및 시작 노드 삽입
queue = deque()
visited[start] = ____
queue.append((start, ____))
```

## 난이도 조절

사용자가 명시하면 조절 가능:

| 난이도 | 설명 |
|--------|------|
| 쉽게 / 힌트 많이 | TODO 설명을 더 구체적으로, 빈칸 수 줄임 |
| 어렵게 / 힌트 없이 | TODO 설명 최소화, 빈칸 수 늘림 (메서드명도 가림) |
| **기본값: 중간** | 핵심 로직만 가림, 힌트는 방향만 |

## 주의사항

- ✅ 원본 파일은 절대 덮어쓰지 않음 (`_blank` 접미사 필수)
- ✅ `____` 는 4개 밑줄로 통일 (가시성)
- ✅ TODO 번호는 코드 흐름 순서 준수
- ✅ 빈칸 개수가 너무 많으면 사용자에게 확인 (20개 이상)
- ❌ 정답을 TODO 주석에 직접 쓰지 않기
- ❌ import / 클래스 시그니처 / 단순 변수 선언은 가리지 않기

## 관련 스킬

- `/algo:hint` - 빈칸 채우기 막힐 때 힌트
- `/algo:review` - 풀이 후 복습 문서 생성
- `/algo:search` - 유사 난이도 문제 검색
