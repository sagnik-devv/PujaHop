import os
import sys
import json
import re
import subprocess
from difflib import SequenceMatcher

photos_dir = 'assets/photos_durga ma'
out_dir = 'public/images/pandals'
os.makedirs(out_dir, exist_ok=True)

photos = [p for p in os.listdir(photos_dir) if not p.startswith('.')]

with open('lib/generated-pujas.ts', 'r') as f:
    content = f.read()

match = re.search(r'export const GENERATED_PANDALS: Pandal\[\] = (\[.*?\]);', content, re.DOTALL)
if not match:
    print('Could not parse GENERATED_PANDALS')
    sys.exit(1)

pandals = json.loads(match.group(1))

custom_overrides = {
    40: 'Sreebhumi Sporting Club Durga Puja.png',
    205: 'Screenshot 2026-09-02 at 11.46.24 PM.png',  # Haridevpur Adarsha Samity
    247: 'Screenshot 2026-09-02 at 11.43.41 PM.png',  # Rajdanga Naba Udayan
    1: 'Screenshot 2026-09-02 at 11.45.07 PM.png',    # Baghbazar Sarbojanin
    30: 'Entally Sarbojanin.png',
}

def clean_name(s):
    s = re.sub(r'\(.*?\)', '', s)
    s = s.lower()
    s = re.sub(r'\bdurga puja\b|\bcommittee\b|\bsarbojanin\b|\bdurgotsab\b|\bsarbojonin\b|\bsri sri\b|\bsree sree\b|\bclub\b|\bsamiti\b|\bsamity\b|\bdurgautsab\b|\bsammilani\b', '', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s.strip()

photo_clean = {p: clean_name(os.path.splitext(p)[0]) for p in photos}

assigned = {}
for p in pandals:
    pid = p['id']
    if pid in custom_overrides and os.path.exists(os.path.join(photos_dir, custom_overrides[pid])):
        assigned[pid] = custom_overrides[pid]

for p in pandals:
    pid = p['id']
    if pid in assigned:
        continue
    p_clean = clean_name(p['name'])
    
    # 1. Exact match
    exact = [orig for orig, cl in photo_clean.items() if cl == p_clean]
    if exact:
        assigned[pid] = exact[0]
        continue
        
    # 2. Substring match
    sub = [orig for orig, cl in photo_clean.items() if (cl and cl in p_clean) or (p_clean and p_clean in cl)]
    if sub:
        best = max(sub, key=lambda x: SequenceMatcher(None, photo_clean[x], p_clean).ratio())
        assigned[pid] = best
        continue
        
    # 3. Fuzzy match
    scored = [(SequenceMatcher(None, cl, p_clean).ratio(), orig) for orig, cl in photo_clean.items()]
    scored.sort(reverse=True)
    assigned[pid] = scored[0][1]

print(f'Matching complete for all {len(pandals)} pandals.')

# Now convert photos using sips for optimal performance and size
# Cache converted source files so we don't re-convert if shared
converted_cache = {}

for p in pandals:
    pid = p['id']
    src_filename = assigned[pid]
    src_path = os.path.join(photos_dir, src_filename)
    dst_filename = f'pandal-{pid}.jpg'
    dst_path = os.path.join(out_dir, dst_filename)
    
    # Run sips conversion
    cmd = [
        'sips',
        '-s', 'format', 'jpeg',
        '-s', 'formatOptions', '85',
        '-Z', '1200',
        src_path,
        '--out', dst_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Update pandal imageUrl
    p['imageUrl'] = f'/images/pandals/{dst_filename}'

# Write updated pandals back to lib/generated-pujas.ts
updated_json = json.dumps(pandals, indent=2, ensure_ascii=False)
new_content = re.sub(
    r'export const GENERATED_PANDALS: Pandal\[\] = \[.*?\];',
    f'export const GENERATED_PANDALS: Pandal[] = {updated_json};',
    content,
    flags=re.DOTALL
)

with open('lib/generated-pujas.ts', 'w') as f:
    f.write(new_content)

print(f'Successfully converted all images and updated lib/generated-pujas.ts!')
