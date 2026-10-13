import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { contentRepo, contentTag } from '@/lib/config';

function verify(body: string, signature: string | null, secret: string) {
  if (!signature) return false;

  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** GitHub webhook of the content repo: publishes a push to the main branch right away. */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'webhook secret is not configured' }, { status: 503 });

  const body = await request.text();
  if (!verify(body, request.headers.get('x-hub-signature-256'), secret)) {
    return Response.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event !== 'push') return Response.json({ revalidated: false, reason: `ignored event: ${event}` });

  const { ref } = JSON.parse(body) as { ref?: string };
  if (ref !== `refs/heads/${contentRepo.branch}`) {
    return Response.json({ revalidated: false, reason: `ignored ref: ${ref}` });
  }

  revalidateTag(contentTag, { expire: 0 });
  return Response.json({ revalidated: true });
}
