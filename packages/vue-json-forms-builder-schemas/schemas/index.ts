// Form element model: entity hierarchy + FormDefinition tree + schema generation
export * from './utils';
export * from './registry';
export * from './reconstruct';
export * from './base';
export * from './form';
export * from './form-element';
export * from './form-definition';
export * from './container';
export * from './string';
export * from './color';
export * from './time';
export * from './number';
export * from './boolean';
export * from './html';
export * from './divider';
export * from './button';
export * from './file-upload';
export * from './modal';
export * from './selection';
export * from './reference';
export * from './wizard';
export * from './dependency';
export * from './schema-generator';

// NOTE: realtime collaboration (Yjs) is intentionally NOT re-exported here —
// import from "@educorvi/vue-json-forms-builder-schemas/collab" so consumers
// that run in purely-local mode never load yjs.
