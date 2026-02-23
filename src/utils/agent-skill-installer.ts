import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { mkdir, cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 지원하는 AI 에이전트 플랫폼 정의
 *
 * 각 플랫폼의 스킬 경로 결정 규칙:
 * - 로컬 설정 디렉토리가 cwd에 있으면 → 로컬 스킬 경로
 * - 전역 홈 디렉토리가 있으면 → 전역 스킬 경로
 *
 * | 플랫폼      | 로컬 감지 기준    | 로컬 스킬 경로          | 전역 스킬 경로          |
 * |------------|-----------------|----------------------|----------------------|
 * | Claude Code | .mcp.json       | .claude/skills/      | ~/.claude/skills/    |
 * | Codex CLI   | .codex/         | .codex/skills/       | ~/.codex/skills/     |
 * | Gemini CLI  | .gemini/        | .gemini/skills/      | ~/.gemini/skills/    |
 */
const PLATFORMS = [
  {
    name: 'Claude Code',
    localIndicator: join(process.cwd(), '.mcp.json'),
    localSkillsDir: join(process.cwd(), '.claude', 'skills'),
    globalHomeDir: join(homedir(), '.claude'),
    globalSkillsDir: join(homedir(), '.claude', 'skills'),
  },
  {
    name: 'Codex',
    localIndicator: join(process.cwd(), '.codex'),
    localSkillsDir: join(process.cwd(), '.codex', 'skills'),
    globalHomeDir: join(homedir(), '.codex'),
    globalSkillsDir: join(homedir(), '.codex', 'skills'),
  },
  {
    name: 'Gemini',
    localIndicator: join(process.cwd(), '.gemini'),
    localSkillsDir: join(process.cwd(), '.gemini', 'skills'),
    globalHomeDir: join(homedir(), '.gemini'),
    globalSkillsDir: join(homedir(), '.gemini', 'skills'),
  },
];

/** 플랫폼별 스킬을 설치할 대상 경로를 결정합니다. */
function resolveTargetDir(platform: (typeof PLATFORMS)[number]): string | null {
  if (existsSync(platform.localIndicator)) return platform.localSkillsDir;
  if (existsSync(platform.globalHomeDir)) return platform.globalSkillsDir;
  return null; // 해당 플랫폼 미설치
}

/** 스킬 디렉토리에 algokit 스킬을 복사합니다. 이미 같은 버전이면 건너뜁니다. */
async function installSkillsTo(
  skillsSrc: string,
  targetDir: string,
  version: string,
  platformName: string
): Promise<void> {
  const versionFile = join(targetDir, '.algokit-skills-version');

  if (existsSync(versionFile)) {
    const installed = readFileSync(versionFile, 'utf-8').trim();
    if (installed === version) return;
  }

  await mkdir(targetDir, { recursive: true });

  // 기존 다른 스킬을 건드리지 않도록 algokit 스킬 디렉토리만 선택적 복사
  for (const skillDir of readdirSync(skillsSrc)) {
    await cp(join(skillsSrc, skillDir), join(targetDir, skillDir), {
      recursive: true,
      force: true,
    });
  }

  writeFileSync(versionFile, version);
  process.stderr.write(`[algokit] skills v${version} installed → ${targetDir} (${platformName})\n`);
}

/**
 * 감지된 모든 AI 에이전트 플랫폼에 스킬을 설치합니다.
 *
 * - 설치된 플랫폼만 대상으로 함 (미설치 플랫폼은 건너뜀)
 * - 로컬/전역 등록 방식에 따라 적절한 경로에 설치
 * - 버전이 같으면 재설치 없이 건너뜀
 */
export async function ensureSkillsInstalled(): Promise<void> {
  const skillsSrc = join(__dirname, '../../skills');
  if (!existsSync(skillsSrc)) return;

  const pkgPath = join(__dirname, '../../package.json');
  const { version } = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  await Promise.all(
    PLATFORMS.map(async (platform) => {
      const targetDir = resolveTargetDir(platform);
      if (!targetDir) return;
      await installSkillsTo(skillsSrc, targetDir, version, platform.name);
    })
  );
}
