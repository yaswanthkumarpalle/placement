import csv
from pathlib import Path

SOURCE_FILE = Path(__file__).resolve().parent / 'uploads' / 'Students_Directory_ALL_2026-09-27.csv'
TARGET_FILE = Path(__file__).resolve().parent / 'data' / 'students.csv'

fieldnames = [
    'id',
    'fullName',
    'branch',
    'cgpa',
    'backlogs',
    'codingScore',
    'status',
    'pipelineStage',
    'company',
]

def normalize_status(status: str) -> str:
    value = (status or '').strip()
    if value.lower() == 'placed':
        return 'Placed'
    if value.lower() == 'in process':
        return 'In Process'
    return 'Unplaced'


def normalize_pipeline(status: str) -> str:
    value = normalize_status(status)
    if value == 'Placed':
        return 'Selected'
    if value == 'In Process':
        return 'Technical Round'
    return 'Applied'


with SOURCE_FILE.open('r', encoding='utf-8', newline='') as src:
    reader = csv.DictReader(src)
    rows = []
    for row in reader:
        if not (row.get('Student ID') or '').strip():
            continue

        status = normalize_status(row.get('Status', ''))
        company = (row.get('Company', '') or '').strip()
        if not company:
            company = '-'

        rows.append({
            'id': (row.get('Student ID', '') or '').strip(),
            'fullName': (row.get('Full Name', '') or '').strip(),
            'branch': (row.get('Branch', '') or '').strip(),
            'cgpa': float((row.get('CGPA', '0') or '0').strip() or 0),
            'backlogs': int((row.get('Active Backlogs', '0') or '0').strip() or 0),
            'codingScore': int((row.get('Coding Score', '0') or '0').strip() or 0),
            'status': status,
            'pipelineStage': normalize_pipeline(status),
            'company': company,
        })

TARGET_FILE.parent.mkdir(parents=True, exist_ok=True)
with TARGET_FILE.open('w', encoding='utf-8', newline='') as dst:
    writer = csv.DictWriter(dst, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f'Converted {len(rows)} rows into {TARGET_FILE}')
