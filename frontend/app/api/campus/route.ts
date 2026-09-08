import { database } from '@/server/database';
import { ApiError, currentUser, startSession, snapshot, book, cancel, setRole } from '@/server/campus-service';
export const dynamic = 'force-dynamic';
function json(body: unknown, status = 200, headers: Record<string,string> = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie', ...headers } });
}
function failure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error('Campus API database operation failed', error instanceof Error ? error.message : 'Unknown error');
  return json({ error: 'Не удалось связаться с хранилищем. Попробуйте ещё раз.' }, 503);
}
export async function GET(request: Request) {
  try {
    const db = database(), now = Date.now();
    return json(await snapshot(db, await currentUser(db, request, now), now));
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.headers.get('host');
    const publicOrigin = `${forwardedProto || requestUrl.protocol.replace(':', '')}://${forwardedHost || requestUrl.host}`;
    if (request.headers.get('origin') !== publicOrigin || request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'Недопустимый источник запроса.');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'Ожидается JSON.');
    const reader = request.body?.getReader();
    let size = 0, body = '';
    const decoder = new TextDecoder();
    if (reader) { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 4096) { await reader.cancel(); throw new ApiError(413,'Слишком большой запрос.'); } body += decoder.decode(chunk.value, { stream: true }); } }
    body += decoder.decode();
    let input;
    try { input = JSON.parse(body); } catch { throw new ApiError(400, 'Некорректный JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400,'Некорректный запрос.');
    const db = database(), now = Date.now();
    if (input.action === 'session') {
      const cookie = await startSession(db, request, now);
      return json({ success: true }, 200, cookie ? { 'Set-Cookie': cookie } : {});
    }
    const user = await currentUser(db, request, now);
    if (!user) throw new ApiError(401, 'Сессия истекла. Обновите страницу.');
    if (input.action === 'book') return json({ success: true, booking: await book(db,user,input,now) });
    if (input.action === 'cancel') return json({ success: true, ...await cancel(db,user,input.id,now) });
    if (input.action === 'set_role') return json({ success: true, ...await setRole(db,user,input.role) });
    throw new ApiError(400, 'Неизвестное действие.');
  } catch (error) { return failure(error); }
}
