export async function fetchJSON<T>(url: string, token?: string): Promise<T> {
  const jsonRes = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  return await jsonRes.json();
}
