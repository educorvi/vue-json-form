import German from './german.json';
import English from './english.json';

export abstract class LanguageProvider {
    abstract getString(key: string): string;
    getStringTemplate(key: string, ...data: any[]): string {
        let value = this.getString(key);
        const placeholders = value.match(/!&data&!/g) || [];
        placeholders.forEach((_, i) => {
            value = value.replace(/!&data&!/, data[i] || '');
        });
        return value;
    }
}

export abstract class JSONLanguageProvider extends LanguageProvider {
    abstract data: typeof English;
    getString(key: string): string {
        let obj: any = this.data;
        for (let subKey of key.split('.')) {
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
