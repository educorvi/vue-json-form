import type { ControlFormattingOptions, Options, TagsOptions } from '@/typings/ui-schema';

export function isTagsConfig(options: Options | undefined): options is TagsOptions & Options {
    return 'tags' in (options || {});
}
