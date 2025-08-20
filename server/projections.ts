import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

export async function fetchPositionProjections(position: string) {
  const url = `https://www.fantasypros.com/nfl/projections/${position}.csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FantasyPros request failed with status ${res.status}`);
  }
  const csv = await res.text();
  const records = parse(csv, { columns: true });
  return records;
}
