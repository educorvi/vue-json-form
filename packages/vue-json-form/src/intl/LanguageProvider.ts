import German from './german.json';
import English from './english.json';

type TranslationValue = string | TranslationRecord;
interface TranslationRecord {
    [key: string]: TranslationValue;
}

function isTranslationRecord(value: unknown): value is TranslationRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export abstract class LanguageProvider {
    abstract getString(key: string): string;
    getStringTemplate(key: string, ...data: unknown[]): string {
        let value = this.getString(key);
        const placeholders = value.match(/!&data&!/g) || [];
        placeholders.forEach((_, i) => {
            value = value.replace(/!&data&!/, data[i]?.toString() || '');
        });
        return value;
    }
}

export abstract class JSONLanguageProvider extends LanguageProvider {
    abstract data: TranslationRecord;
    getString(key: string): string {
        let value: TranslationValue | undefined = this.data;
        for (const subKey of key.split('.')) {
            if (!isTranslationRecord(value)) {
                return key;
            }
            value = value[subKey];
        }
        return typeof value === 'string' ? value : key;
    }
}

export class GermanLanguageProvider extends JSONLanguageProvider {
    data = German;
}

export class EnglishLanguageProvider extends JSONLanguageProvider {
    data = English;
}

export class AutoLanguageProvider extends LanguageProvider {
    private provider: LanguageProvider;

    constructor() {
        super();
        const lang = navigator.language || 'en';
        if (lang.startsWith('de')) {
            this.provider = new GermanLanguageProvider();
        } else {
            this.provider = new EnglishLanguageProvider();
        }
    }

    getString(key: string): string {
        return this.provider.getString(key);
    }
}
