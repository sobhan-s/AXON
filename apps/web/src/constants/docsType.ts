export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_SIZE = 10 * 1024 * 1024 * 1024;

export type TypeFilter = 'ALL' | 'image' | 'video' | 'document';
