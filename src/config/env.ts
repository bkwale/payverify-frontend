// -----------------------------------------------------------------------------
// src/config/env.ts
// Centralised environment configuration + startup validation.
// Replaces scattered `process.env.X!` non-null assertions that crashed the
// serverless function at cold start. Validates ONCE at startup and prints a
// single clear report; missing optional vars disable a feature, never crash boot.
// -----------------------------------------------------------------------------
interface EnvSpec { name: string; required: boolean; note?: string; }

const SPEC: EnvSpec[] = [
    { name: 'DATABASE_URL',          required: true,  note: 'Postgres connection string' },
    { name: 'JWT_SECRET',            required: true,  note: 'auth token signing & verification' },
    { name: 'QR_SECRET',             required: false, note: 'QR token signing' },
    { name: 'PAYSTACK_SECRET_KEY',   required: false, note: 'Paystack payments' },
    { name: 'PAYSTACK_BASE_URL',     required: false },
    { name: 'RESEND_API_KEY',        required: false, note: 'Resend transactional email' },
    { name: 'SENDGRID_API_KEY',      required: false, note: 'SendGrid email' },
    { name: 'SENDGRID_FROM_EMAIL',   required: false },
    { name: 'NOTIFY_FROM_EMAIL',     required: false },
    { name: 'CLOUDINARY_CLOUD_NAME', required: false },
    { name: 'CLOUDINARY_API_KEY',    required: false },
    { name: 'CLOUDINARY_API_SECRET', required: false },
    { name: 'OPENAI_API_KEY',        required: false, note: 'AI analytics' },
    { name: 'TURNSTILE_SECRET_KEY',  required: false, note: 'Cloudflare Turnstile captcha' },
    { name: 'FRONTEND_URL',          required: false },
];

/** Validate env and print one consolidated report at startup. Never throws. */
export function validateEnv(): void {
    const req = SPEC.filter(s => s.required && !process.env[s.name]);
    const opt = SPEC.filter(s => !s.required && !process.env[s.name]);
    if (!req.length && !opt.length) { console.log('[env] All known environment variables present.'); return; }
    if (req.length) { console.error('[env] Missing REQUIRED variables — core features will not work:');
        req.forEach(s => console.error(`   - ${s.name}${s.note ? ` (${s.note})` : ''}`)); }
    if (opt.length) { console.warn('[env] Missing optional variables — related features disabled:');
        opt.forEach(s => console.warn(`   - ${s.name}${s.note ? ` (${s.note})` : ''}`)); }
}

/** Typed safe accessor — use instead of `process.env.X!`. */
export const env = {
    get(name: string, fallback = ''): string { return process.env[name] ?? fallback; },
    has(name: string): boolean { return Boolean(process.env[name]); },
    require(name: string): string {
        const v = process.env[name];
        if (!v) throw new Error(`[env] Required variable ${name} is not set`);
        return v;
    },
};
