// utils/sanitize.ts
export function sanitize(input: string): string {
  if (!input) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (m) => map[m]);
}

