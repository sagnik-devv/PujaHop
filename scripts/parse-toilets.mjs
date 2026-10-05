import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseCSV(text) {
  const lines = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current);
      current = '';
      if (row.length > 0 && row.some(cell => cell.trim().length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some(cell => cell.trim().length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

const sourceToiletPath = path.join(rootDir, 'pujo csv', 'data', 'toilets.csv');
const content = fs.readFileSync(sourceToiletPath, 'utf8');
const rows = parseCSV(content);
const headers = rows[0].map(h => h.trim());

const toilets = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;
  const obj = {};
  headers.forEach((h, idx) => {
    obj[h] = row[idx] ? row[idx].trim() : '';
  });

  const lat = parseFloat(obj.latitude);
  const lon = parseFloat(obj.longitude);
  const cleanliness = parseFloat(obj.cleanliness_score);

  if (isNaN(lat) || isNaN(lon)) continue;

  toilets.push({
    id: `toilet-${i}`,
    toiletName: obj.toilet_name || '',
    locationAddress: obj.location_address || '',
    latitude: lat,
    longitude: lon,
    cleanlinessScore: isNaN(cleanliness) ? 0 : cleanliness,
    genderAccess: obj.gender_access || '',
    femaleFriendly: obj.female_friendly || '',
    nearestPandal: obj.nearest_pandal || '',
    distanceToPandalMeters: parseInt(obj.distance_to_pandal_meters, 10) || 0,
  });
}

const outPath = path.join(rootDir, 'lib', 'generated-toilets.ts');
const outContent = `// Auto-generated - DO NOT EDIT DIRECTLY
import { Toilet } from './types';

export const GENERATED_TOILETS: Toilet[] = ${JSON.stringify(toilets, null, 2)};
`;

fs.writeFileSync(outPath, outContent, 'utf8');
console.log('Toilets parsed successfully!');
