import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

export async function fetchPlayerStats(pfrId: string, season: string) {
  const first = pfrId.charAt(0);
  const url = `https://www.pro-football-reference.com/players/${first}/${pfrId}/gamelog/${season}/?download=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`PFR request failed with status ${res.status}`);
  }
  const csv = await res.text();
  const records = parse(csv, { columns: true });
  return records;
}
