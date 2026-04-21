/**
 * groqClient.js
 *
 * - Production (Vercel): calls /api/groq so the key stays server-side.
 * - Local dev (npm run dev): calls Groq directly using VITE_GROQ_API_KEY
 *   because the Vercel serverless runtime isn't available locally.
 *
 * Your .env should have:
 *   VITE_GROQ_API_KEY=gsk_...   ← only used locally, never shipped to prod users
 *   GROQ_API_KEY=gsk_...        ← set in Vercel Dashboard env vars (server-side)
 */

const IS_DEV = import.meta.env.DEV; // true when running `npm run dev`

export async function groqChat(body) {
  // ── Local dev: call Groq directly ────────────────────────────────────────
  if (IS_DEV) {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) {
      throw new Error(
        'Add VITE_GROQ_API_KEY to your .env file for local development.'
      );
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error: ${res.status}`);
    }

    return res.json();
  }

  // ── Production: call through Vercel serverless proxy ─────────────────────
  const res = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq proxy error: ${res.status}`);
  }

  return res.json();
}