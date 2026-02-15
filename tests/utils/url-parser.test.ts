/**
 * URL 파서 단위 테스트 (프로그래머스)
 */
import { describe, it, expect } from 'vitest';
import { parseProgrammersUrl } from '../../src/utils/url-parser.js';

describe('parseProgrammersUrl', () => {
  describe('유효한 입력', () => {
    it('전체 URL 파싱', () => {
      const result = parseProgrammersUrl(
        'https://school.programmers.co.kr/learn/courses/30/lessons/42748'
      );
      expect(result).toBe('42748');
    });

    it('상대 경로 파싱', () => {
      const result = parseProgrammersUrl('/learn/courses/30/lessons/42748');
      expect(result).toBe('42748');
    });

    it('숫자 입력', () => {
      const result = parseProgrammersUrl(42748);
      expect(result).toBe('42748');
    });

    it('숫자 문자열 입력', () => {
      const result = parseProgrammersUrl('42748');
      expect(result).toBe('42748');
    });

    it('URL에 쿼리 파라미터가 있어도 파싱', () => {
      const result = parseProgrammersUrl(
        'https://school.programmers.co.kr/learn/courses/30/lessons/42748?language=javascript'
      );
      expect(result).toBe('42748');
    });

    it('URL에 앵커가 있어도 파싱', () => {
      const result = parseProgrammersUrl(
        'https://school.programmers.co.kr/learn/courses/30/lessons/42748#description'
      );
      expect(result).toBe('42748');
    });
  });

  describe('유효하지 않은 입력', () => {
    it('잘못된 URL 형식', () => {
      const result = parseProgrammersUrl('https://programmers.co.kr/invalid');
      expect(result).toBeNull();
    });

    it('빈 문자열', () => {
      const result = parseProgrammersUrl('');
      expect(result).toBeNull();
    });

    it('lessons 키워드 없는 URL', () => {
      const result = parseProgrammersUrl(
        'https://school.programmers.co.kr/learn/courses/30'
      );
      expect(result).toBeNull();
    });

    it('숫자가 아닌 문자열', () => {
      const result = parseProgrammersUrl('invalid');
      expect(result).toBeNull();
    });
  });
});
