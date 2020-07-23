export function extractQuerystringParameters(querystring: string) {
  return querystring
    .replace('?', '')
    .split('&')
    .map((segment) => segment.split('='))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, any>);
}
