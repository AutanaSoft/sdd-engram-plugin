import { describe, expect, it } from 'vitest';
import { formatActiveModelBadgeText, resolveActiveModelBadgeStyle } from './components';
import type { ActiveProfileState } from './src/types';

const baseProfile: ActiveProfileState = {
  modelId: 'openai/gpt-5',
  contextLimit: 400000,
  providerName: 'OpenAI',
  modelName: 'GPT-5',
};

describe('formatActiveModelBadgeText', () => {
  it('should return placeholder when profile is null', () => {
    expect(formatActiveModelBadgeText(null)).toBe('No SDD model active');
  });

  it('should return placeholder when profile is undefined', () => {
    expect(formatActiveModelBadgeText(undefined)).toBe('No SDD model active');
  });

  it('should include reasoning effort when present', () => {
    const text = formatActiveModelBadgeText({
      ...baseProfile,
      reasoningEffort: 'high',
    });

    expect(text).toBe('GPT-5 · 400k ctx · effort: high');
  });

  it('should omit effort when absent', () => {
    const text = formatActiveModelBadgeText(baseProfile);

    expect(text).toBe('GPT-5 · 400k ctx');
  });

  it('should use profile name when display mode is "profile" and profileName is set', () => {
    const text = formatActiveModelBadgeText(
      { ...baseProfile, profileName: 'frontend-team' },
      'profile',
    );

    expect(text).toBe('frontend-team · 400k ctx');
  });

  it('should fall back to model name when display mode is "profile" but profileName is missing', () => {
    const text = formatActiveModelBadgeText(baseProfile, 'profile');

    expect(text).toBe('GPT-5 · 400k ctx');
  });

  it('should fall back to model name when display mode is "profile" but profileName is blank', () => {
    const text = formatActiveModelBadgeText(
      { ...baseProfile, profileName: '   ' },
      'profile',
    );

    expect(text).toBe('GPT-5 · 400k ctx');
  });

  it('should ignore profile name when display mode is "model" (default)', () => {
    const text = formatActiveModelBadgeText({
      ...baseProfile,
      profileName: 'frontend-team',
    });

    expect(text).toBe('GPT-5 · 400k ctx');
  });

  it('should keep effort label when display mode is "profile" and profileName is set', () => {
    const text = formatActiveModelBadgeText(
      {
        ...baseProfile,
        profileName: 'frontend-team',
        reasoningEffort: 'high',
      },
      'profile',
    );

    expect(text).toBe('frontend-team · 400k ctx · effort: high');
  });
});

describe('resolveActiveModelBadgeStyle', () => {
  it('uses theme.primary for the active icon when profile is set', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, { primary: '#abcdef' });
    expect(style.iconFg).toBe('#abcdef');
  });

  it('falls back to #00ff00 for the active icon when theme.primary is missing', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, {});
    expect(style.iconFg).toBe('#00ff00');
  });

  it('falls back to #00ff00 for the active icon when theme is undefined', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, undefined);
    expect(style.iconFg).toBe('#00ff00');
  });

  it('uses theme.textMuted for the inactive icon when profile is null', () => {
    const style = resolveActiveModelBadgeStyle(null, { textMuted: '#777' });
    expect(style.iconFg).toBe('#777');
  });

  it('falls back to #888 for the inactive icon when theme.textMuted is missing', () => {
    const style = resolveActiveModelBadgeStyle(null, {});
    expect(style.iconFg).toBe('#888');
  });

  it('falls back to #888 for the inactive icon when profile is undefined and theme is undefined', () => {
    const style = resolveActiveModelBadgeStyle(undefined, undefined);
    expect(style.iconFg).toBe('#888');
  });

  it('uses theme.text for the label when available', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, { text: '#ff0000' });
    expect(style.labelFg).toBe('#ff0000');
  });

  it('falls back to "inherit" for the label when theme.text is missing', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, {});
    expect(style.labelFg).toBe('inherit');
  });

  it('falls back to "inherit" for the label when theme is undefined', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, undefined);
    expect(style.labelFg).toBe('inherit');
  });

  it('sets icon attributes to 1 when profile is present', () => {
    const style = resolveActiveModelBadgeStyle(baseProfile, {});
    expect(style.iconAttributes).toBe(1);
  });

  it('sets icon attributes to 0 when profile is null', () => {
    const style = resolveActiveModelBadgeStyle(null, {});
    expect(style.iconAttributes).toBe(0);
  });

  it('sets icon attributes to 0 when profile is undefined', () => {
    const style = resolveActiveModelBadgeStyle(undefined, {});
    expect(style.iconAttributes).toBe(0);
  });
});
