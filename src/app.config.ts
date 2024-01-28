import { config } from 'dotenv';
config({ path: `.env` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const { DATABASE_URL, APP_SECRET, HOST, ORIGIN, PORT, DATE_FORMAT } =
  process.env;
