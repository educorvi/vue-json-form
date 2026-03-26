import type { SseEvent } from '@/vueComponentCommons.ts';

export type StageStatus = 'WAITING' | 'PROCESSING' | 'DONE' | 'ERROR';

enum SummaryStage {
    PREPROCESSING = 'PREPROCESSING',
    PAGE_COUNTING = 'PAGE_COUNTING',
    IMAGE_CONVERSION = 'IMAGE_CONVERSION',
    MARKDOWN_CONVERSION = 'MARKDOWN_CONVERSION',
    GENERATING = 'GENERATING',
}
export interface PromptType {
    name: string;
    description: string;
}

export interface SummaryProgressEvent {
    stage: SummaryStage;
    status: StageStatus;
    current?: number;
    total?: number;
    message?: string;
}

export interface SummaryResultEvent {
    summary: string;
}

export interface SummaryErrorEvent {
    message: string;
    details?: string;
}
