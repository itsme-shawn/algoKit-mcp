/**
 * search_programmers_problems 도구 통합 테스트
 */

import { searchProgrammersProblemsTool } from '../src/tools/search-problems-programmers.js';

async function testSearchProgrammersProblems() {
  console.log('🧪 search_programmers_problems 도구 통합 테스트\n');

  const tool = searchProgrammersProblemsTool();

  // 테스트 케이스 1: 레벨 1 문제 검색
  console.log('=== Test 1: 레벨 1 문제 검색 ===');
  try {
    const result1 = await tool.handler({ levels: [1], limit: 5 });
    console.log('✅ 성공!');
    console.log(result1.text.substring(0, 500) + '...\n');
  } catch (error) {
    console.error('❌ 실패:', (error as Error).message);
  }

  // 3초 대기 (Rate Limiting)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 테스트 케이스 2: 최신순 정렬
  console.log('=== Test 2: 최신순 정렬 ===');
  try {
    const result2 = await tool.handler({ order: 'recent', limit: 3 });
    console.log('✅ 성공!');
    console.log(result2.text.substring(0, 500) + '...\n');
  } catch (error) {
    console.error('❌ 실패:', (error as Error).message);
  }

  console.log('✅ 테스트 완료!');
  console.log('\n💡 MCP 서버에서 사용 가능합니다:');
  console.log('   - search_programmers_problems({ levels: [1] })');
  console.log('   - search_programmers_problems({ order: "accuracy", limit: 10 })');
}

testSearchProgrammersProblems().catch(console.error);
