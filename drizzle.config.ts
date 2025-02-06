import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
    out: './drizzle',
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});