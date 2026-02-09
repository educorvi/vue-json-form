import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LanguageProvider,
  JSONLanguageProvider,
  GermanLanguageProvider,
  EnglishLanguageProvider,
  AutoLanguageProvider,
} from '@/intl/LanguageProvider';
import english from '@/intl/english.json';
import german from '@/intl/german.json';

class TestProvider extends JSONLanguageProvider {
  data = {
    a: {
      b: 'value',
      c: 123 as unknown as string, // non-string should trigger fallback
      templ: 'First !&data&! and second !&data&! and third !&data&!',
    },
  } as unknown as typeof english;
}

describe('LanguageProvider base behavior', () => {
  it('getStringTemplate replaces placeholders with provided data in order and ignores extras', () => {
    const p = new TestProvider();
    const s = p.getStringTemplate('a.templ', 'X', 'Y', 'Z', 'EXTRA');
    expect(s).toBe('First X and second Y and third Z');
  });

  it('getStringTemplate uses empty string for missing data args', () => {
    const p = new TestProvider();
    const s = p.getStringTemplate('a.templ', 'ONLY');
    expect(s).toBe('First ONLY and second  and third ');
  });
});

describe('JSONLanguageProvider.getString', () => {
  it('returns nested string values by dot-separated key', () => {
    const p = new TestProvider();
    expect(p.getString('a.b')).toBe('value');
  });

  it('returns key when path does not exist', () => {
    const p = new TestProvider();
    expect(p.getString('a.missing.sub')).toBe('a.missing.sub');
  });

  it('returns key when found value is not a string', () => {
    const p = new TestProvider();
    expect(p.getString('a.c')).toBe('a.c');
  });
});

describe('Concrete providers', () => {
  it('GermanLanguageProvider returns German string for known key', () => {
    const gp = new GermanLanguageProvider();
    // choose a known nested key
    expect(gp.getString('errors.fileUpload.tooManyFiles')).toBe(
      german.errors.fileUpload.tooManyFiles
    );
  });

  it('EnglishLanguageProvider returns English string for known key', () => {
    const ep = new EnglishLanguageProvider();
    expect(ep.getString('errors.fileUpload.tooManyFiles')).toBe(
      english.errors.fileUpload.tooManyFiles
    );
  });
});

describe('AutoLanguageProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setNavigatorLanguage(lang: string) {
    // Mock the getter for navigator.language
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(lang);
  }

  it('selects German provider when navigator.language starts with de', () => {
    setNavigatorLanguage('de-DE');
    const ap = new AutoLanguageProvider();
    expect(ap.getString('errors.fileUpload.tooFewFiles')).toBe(
      german.errors.fileUpload.tooFewFiles
    );
  });

  it('falls back to English for non-de languages', () => {
    setNavigatorLanguage('en-US');
    const ap = new AutoLanguageProvider();
    expect(ap.getString('errors.fileUpload.tooFewFiles')).toBe(
      english.errors.fileUpload.tooFewFiles
    );
  });
});

describe('translation key parity across languages', () => {
  function collectKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    for (const k of Object.keys(obj)) {
      const value = obj[k];
      const path = prefix ? `${prefix}.${k}` : k;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...collectKeys(value, path));
      } else {
        keys.push(path);
      }
    }
    return keys.sort();
  }

  it('english.json and german.json expose identical key sets', () => {
    const enKeys = collectKeys(english);
    const deKeys = collectKeys(german);
    // Symmetric difference should be empty
    const onlyInEn = enKeys.filter((k) => !deKeys.includes(k));
    const onlyInDe = deKeys.filter((k) => !enKeys.includes(k));

    expect(onlyInEn, `Keys only in English: ${onlyInEn.join(', ')}`).toEqual([]);
    expect(onlyInDe, `Keys only in German: ${onlyInDe.join(', ')}`).toEqual([]);
  });
});
