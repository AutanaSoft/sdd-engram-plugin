import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as child_process from 'node:child_process';
import * as config from './config';
const {
  readPluginShortcutBindings,
  resolvePaths,
  resolveEngramProjectName,
  resolveProjectCandidates,
  resolveProjectName,
  resolveWorkspaceRoot,
} = config;

vi.mock('node:os');
vi.mock('node:fs');
vi.mock('node:child_process');

describe('config logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  describe('resolvePaths', () => {
    it('should resolve paths using default XDG (home/.config)', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      const originalEnv = { ...process.env };
      delete process.env.XDG_CONFIG_HOME;

      try {
        const paths = resolvePaths();
        expect(paths.configRoot).toBe(path.join('/home/user', '.config', 'opencode'));
        expect(paths.profileVersionsDir).toBe(path.join('/home/user', '.config', 'opencode', 'profile-versions'));
      } finally {
        process.env = originalEnv;
      }
    });

    it('should respect XDG_CONFIG_HOME override', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      const originalEnv = { ...process.env };
      process.env.XDG_CONFIG_HOME = '/custom/config';

      try {
        const paths = resolvePaths();
        expect(paths.configRoot).toBe(path.join('/custom/config', 'opencode'));
        expect(paths.profileVersionsDir).toBe(path.join('/custom/config', 'opencode', 'profile-versions'));
        expect(paths.pluginConfigPath).toBe(path.join('/custom/config', 'opencode', 'sdd-model-select.json'));
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('readPluginShortcutBindings', () => {
    it('should return default dual-platform shortcuts when plugin config is missing', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(readPluginShortcutBindings()).toEqual(['alt+k', 'super+k']);
    });

    it('should expand shortcut into alt and super bindings', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{"shortcut":"Alt + J"}');

      expect(readPluginShortcutBindings()).toEqual(['alt+j', 'super+j']);
    });

    it('should honor explicit shortcuts array as-is after normalization', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{"shortcuts":[" Ctrl + J ","super+j","ctrl+j"]}');

      expect(readPluginShortcutBindings()).toEqual(['ctrl+j', 'super+j']);
    });

    it('should fall back to defaults when plugin config JSON is invalid', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{invalid json');

      expect(readPluginShortcutBindings()).toEqual(['alt+k', 'super+k']);
    });
  });

  describe('resolveProjectCandidates', () => {
    it('should return all candidates (remote, root, directory)', () => {
      const api = { state: { path: { directory: '/path/to/my-repo' } } };
      
      vi.mocked(child_process.execFileSync).mockImplementation((cmd, args: any) => {
        if (args?.includes('remote')) return 'https://github.com/org/my-repo.git';
        if (args?.includes('rev-parse')) return '/path/to/my-repo';
        return '';
      });

      const candidates = resolveProjectCandidates(api);
      expect(candidates).toContain('my-repo');
      expect(candidates.length).toBe(1); // deduplicated
    });

    it('should handle git failures gracefully', () => {
      const api = { state: { path: { directory: '/path/to/my-repo' } } };
      
      vi.mocked(child_process.execFileSync).mockImplementation(() => {
        throw new Error('Not a git repo');
      });

      const candidates = resolveProjectCandidates(api);
      expect(candidates).toEqual(['my-repo']); // only directory name fallback
    });
  });

  describe('resolveEngramProjectName', () => {
    it('should return project_name from workspace .engram config', () => {
      const api = { state: { path: { directory: '/workspace/root' } } };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{"project_name":"custom-project"}');

      expect(resolveEngramProjectName(api)).toBe('custom-project');
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join('/workspace/root', '.engram', 'config.json'),
        'utf-8'
      );
    });

    it('should return null when .engram config does not exist', () => {
      const api = { state: { path: { directory: '/workspace/root' } } };
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(resolveEngramProjectName(api)).toBeNull();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should return null and log when .engram config is invalid', () => {
      const api = { state: { path: { directory: '/workspace/root' } } };
      const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{invalid json');

      expect(resolveEngramProjectName(api)).toBeNull();
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('[sdd-plugin][config] resolveEngramProjectName: failed to read'),
        expect.any(Error)
      );
      stderrSpy.mockRestore();
    });
  });

  describe('resolveProjectName', () => {
    it('should return the first candidate', () => {
      const api = { state: { path: { directory: '/path/to/repo' } } };
      vi.mocked(child_process.execFileSync).mockImplementation((cmd, args: any) => {
        if (args?.includes('remote')) return 'repo-from-git';
        if (args?.includes('rev-parse')) return '/path/to/repo';
        return '';
      });
      
      const name = resolveProjectName(api);
      expect(name).toBe('repo-from-git');
    });
  });

  describe('resolveWorkspaceRoot', () => {
    it('should return api.state.path.directory', () => {
      const api = { state: { path: { directory: '/workspace/root' } } };
      expect(resolveWorkspaceRoot(api)).toBe('/workspace/root');
    });
  });
});
