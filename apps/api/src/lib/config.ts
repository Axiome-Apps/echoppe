import { join } from 'path';

// Upload directory - use env var in production, relative path in dev
export const UPLOAD_DIR = process.env.UPLOAD_DIR || join(import.meta.dir, '../../uploads');
