import { describe, it, expect } from 'vitest';
import {
  levelToTier,
  tierToLevelRange,
  getTierBadge,
  isValidLevel,
  TIER_NAMES,
} from '../../src/utils/tier-converter.js';

describe('tier-converter', () => {
  describe('levelToTier()', () => {
    describe('정상 변환 - 모든 티어 레벨', () => {
      it('should return "Bronze V" when level is 1', () => {
        expect(levelToTier(1)).toBe('Bronze V');
      });

      it('should return "Bronze I" when level is 5', () => {
        expect(levelToTier(5)).toBe('Bronze I');
      });

      it('should return "Silver V" when level is 6', () => {
        expect(levelToTier(6)).toBe('Silver V');
      });

      it('should return "Silver I" when level is 10', () => {
        expect(levelToTier(10)).toBe('Silver I');
      });

      it('should return "Gold V" when level is 11', () => {
        expect(levelToTier(11)).toBe('Gold V');
      });

      it('should return "Gold I" when level is 15', () => {
        expect(levelToTier(15)).toBe('Gold I');
      });

      it('should return "Platinum V" when level is 16', () => {
        expect(levelToTier(16)).toBe('Platinum V');
      });

      it('should return "Platinum I" when level is 20', () => {
        expect(levelToTier(20)).toBe('Platinum I');
      });

      it('should return "Diamond V" when level is 21', () => {
        expect(levelToTier(21)).toBe('Diamond V');
      });

      it('should return "Diamond I" when level is 25', () => {
        expect(levelToTier(25)).toBe('Diamond I');
      });

      it('should return "Ruby V" when level is 26', () => {
        expect(levelToTier(26)).toBe('Ruby V');
      });

      it('should return "Ruby I" when level is 30', () => {
        expect(levelToTier(30)).toBe('Ruby I');
      });
    });

    describe('중간 등급 변환 검증', () => {
      it('should return "Bronze IV" when level is 2', () => {
        expect(levelToTier(2)).toBe('Bronze IV');
      });

      it('should return "Bronze III" when level is 3', () => {
        expect(levelToTier(3)).toBe('Bronze III');
      });

      it('should return "Bronze II" when level is 4', () => {
        expect(levelToTier(4)).toBe('Bronze II');
      });

      it('should return "Gold III" when level is 13', () => {
        expect(levelToTier(13)).toBe('Gold III');
      });
    });

    describe('경계값 테스트', () => {
      it('should throw error when level is 0', () => {
        expect(() => levelToTier(0)).toThrow('Level must be between 1 and 30');
      });

      it('should throw error when level is -1', () => {
        expect(() => levelToTier(-1)).toThrow('Level must be between 1 and 30');
      });

      it('should throw error when level is 31', () => {
        expect(() => levelToTier(31)).toThrow('Level must be between 1 and 30');
      });

      it('should throw error when level is 100', () => {
        expect(() => levelToTier(100)).toThrow('Level must be between 1 and 30');
      });
    });

    describe('타입 검증', () => {
      it('should throw error when level is 15.5 (float)', () => {
        expect(() => levelToTier(15.5)).toThrow('Level must be an integer');
      });

      it('should throw error when level is NaN', () => {
        expect(() => levelToTier(NaN)).toThrow();
      });
    });
  });

  describe('tierToLevelRange()', () => {
    describe('정상 변환 - 모든 티어 그룹', () => {
      it('should return [1, 5] for "Bronze"', () => {
        expect(tierToLevelRange('Bronze')).toEqual([1, 5]);
      });

      it('should return [6, 10] for "Silver"', () => {
        expect(tierToLevelRange('Silver')).toEqual([6, 10]);
      });

      it('should return [11, 15] for "Gold"', () => {
        expect(tierToLevelRange('Gold')).toEqual([11, 15]);
      });

      it('should return [16, 20] for "Platinum"', () => {
        expect(tierToLevelRange('Platinum')).toEqual([16, 20]);
      });

      it('should return [21, 25] for "Diamond"', () => {
        expect(tierToLevelRange('Diamond')).toEqual([21, 25]);
      });

      it('should return [26, 30] for "Ruby"', () => {
        expect(tierToLevelRange('Ruby')).toEqual([26, 30]);
      });
    });

    describe('대소문자 무관 처리', () => {
      it('should return [11, 15] for "gold"', () => {
        expect(tierToLevelRange('gold')).toEqual([11, 15]);
      });

      it('should return [11, 15] for "GOLD"', () => {
        expect(tierToLevelRange('GOLD')).toEqual([11, 15]);
      });

      it('should return [11, 15] for "GoLd"', () => {
        expect(tierToLevelRange('GoLd')).toEqual([11, 15]);
      });

      it('should return [16, 20] for "platinum"', () => {
        expect(tierToLevelRange('platinum')).toEqual([16, 20]);
      });
    });

    describe('유효하지 않은 티어 이름', () => {
      it('should throw error for "Master"', () => {
        expect(() => tierToLevelRange('Master')).toThrow('Invalid tier name');
      });

      it('should throw error for "Unknown"', () => {
        expect(() => tierToLevelRange('Unknown')).toThrow('Invalid tier name');
      });

      it('should throw error for empty string', () => {
        expect(() => tierToLevelRange('')).toThrow('Invalid tier name');
      });

      it('should throw error for whitespace only', () => {
        expect(() => tierToLevelRange('   ')).toThrow('Invalid tier name');
      });
    });
  });

  describe('getTierBadge()', () => {
    describe('정상 뱃지 생성', () => {
      it('should return "🟤 Bronze V" for level 1', () => {
        expect(getTierBadge(1)).toBe('🟤 Bronze V');
      });

      it('should return "🟤 Bronze I" for level 5', () => {
        expect(getTierBadge(5)).toBe('🟤 Bronze I');
      });

      it('should return "⚪ Silver V" for level 6', () => {
        expect(getTierBadge(6)).toBe('⚪ Silver V');
      });

      it('should return "🟡 Gold V" for level 11', () => {
        expect(getTierBadge(11)).toBe('🟡 Gold V');
      });

      it('should return "🟡 Gold I" for level 15', () => {
        expect(getTierBadge(15)).toBe('🟡 Gold I');
      });

      it('should return "🟢 Platinum V" for level 16', () => {
        expect(getTierBadge(16)).toBe('🟢 Platinum V');
      });

      it('should return "🔵 Diamond V" for level 21', () => {
        expect(getTierBadge(21)).toBe('🔵 Diamond V');
      });

      it('should return "🔴 Ruby V" for level 26', () => {
        expect(getTierBadge(26)).toBe('🔴 Ruby V');
      });

      it('should return "🔴 Ruby I" for level 30', () => {
        expect(getTierBadge(30)).toBe('🔴 Ruby I');
      });
    });

    describe('경계값 테스트', () => {
      it('should throw error when level is 0', () => {
        expect(() => getTierBadge(0)).toThrow('Level must be between 1 and 30');
      });

      it('should throw error when level is 31', () => {
        expect(() => getTierBadge(31)).toThrow('Level must be between 1 and 30');
      });
    });
  });

  describe('isValidLevel()', () => {
    describe('유효한 레벨', () => {
      it('should return true for level 1', () => {
        expect(isValidLevel(1)).toBe(true);
      });

      it('should return true for level 15', () => {
        expect(isValidLevel(15)).toBe(true);
      });

      it('should return true for level 30', () => {
        expect(isValidLevel(30)).toBe(true);
      });
    });

    describe('유효하지 않은 레벨', () => {
      it('should return false for level 0', () => {
        expect(isValidLevel(0)).toBe(false);
      });

      it('should return false for level 31', () => {
        expect(isValidLevel(31)).toBe(false);
      });

      it('should return false for level -5', () => {
        expect(isValidLevel(-5)).toBe(false);
      });

      it('should return false for level 15.5', () => {
        expect(isValidLevel(15.5)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isValidLevel(NaN)).toBe(false);
      });
    });
  });

  describe('양방향 변환 일관성', () => {
    it('should maintain consistency for all levels 1-30', () => {
      for (let level = 1; level <= 30; level++) {
        const tierName = levelToTier(level);
        const tierGroup = tierName.split(' ')[0];
        const [min, max] = tierToLevelRange(tierGroup);

        expect(level).toBeGreaterThanOrEqual(min);
        expect(level).toBeLessThanOrEqual(max);
      }
    });

    it('should have matching emoji for all levels', () => {
      for (let level = 1; level <= 30; level++) {
        const badge = getTierBadge(level);
        const tierName = levelToTier(level);

        // 뱃지가 티어 이름을 포함해야 함
        expect(badge).toContain(tierName);

        // 이모지가 포함되어야 함
        expect(badge.length).toBeGreaterThan(tierName.length);
      }
    });
  });

  describe('TIER_NAMES 상수 검증', () => {
    it('should have 6 tier groups', () => {
      expect(Object.keys(TIER_NAMES)).toHaveLength(6);
    });

    it('should have continuous level ranges', () => {
      const tiers = Object.values(TIER_NAMES);
      tiers.sort((a, b) => a.min - b.min);

      for (let i = 0; i < tiers.length - 1; i++) {
        // 다음 티어의 min이 현재 티어의 max + 1이어야 함
        expect(tiers[i + 1].min).toBe(tiers[i].max + 1);
      }
    });

    it('should cover full 1-30 range', () => {
      const allLevels = new Set<number>();

      for (const tier of Object.values(TIER_NAMES)) {
        for (let level = tier.min; level <= tier.max; level++) {
          allLevels.add(level);
        }
      }

      expect(allLevels.size).toBe(30);
      expect(Math.min(...allLevels)).toBe(1);
      expect(Math.max(...allLevels)).toBe(30);
    });

    it('should have unique emojis', () => {
      const emojis = Object.values(TIER_NAMES).map(t => t.emoji);
      const uniqueEmojis = new Set(emojis);

      expect(uniqueEmojis.size).toBe(emojis.length);
    });
  });
});
