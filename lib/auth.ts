export function isAdminAuthorized(req: Request): boolean {
  const secret = (process.env.ADMIN_SECRET || '').trim();
  if (!secret) return false;

  // 1) Bearer header or x-admin-token
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : (req.headers.get('x-admin-token') || req.headers.get('X-Admin-Token') || '').trim();
  if (token && token === secret) return true;

  // 2) Cookie gate set by login route
  const rawCookie = req.headers.get('cookie') || '';
  // naive parse: split by ; and look for admin_auth=1
  const hasCookie = rawCookie.split(/;\s*/).some((c) => c.startsWith('admin_auth=1'));
  if (hasCookie) return true;

  return false;
}
