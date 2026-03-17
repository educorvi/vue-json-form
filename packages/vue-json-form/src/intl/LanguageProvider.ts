import German from './german.json';
import English from './english.json';

export abstract class LanguageProvider {
    abstract getString(key: string): string;
    getStringTemplate(key: string, ...data: unknown[]): string {
        let value = this.getString(key);
        const placeholders = value.match(/!&data&!/g) || [];
        placeholders.forEach((_, i) => {
            value = value.replace(/!&data&!/, String(data[i]) || '');
        });
        return value;
    }
}

type ValueOrRecord<T> = { [key: string]: T | ValueOrRecord<T> };

export abstract class JSONLanguageProvider extends LanguageProvider {
    abstract data: typeof English;
    getString(key: string): string {
        let obj: ValueOrRecord<string> | string | undefined = this.data;
        for (const subKey of key.split('.')) {
            if (typeof obj !== 'object') {
                return key;
            }
            obj = obj?.[subKey];
            if (obj === undefined) {
                return key;
            }
        }
        if (typeof obj !== 'string') {
            return key;
        }
        return obj;
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
