from __future__ import annotations

import json
import random
import re
from pathlib import Path
from typing import Any, Dict, List

from openpyxl import Workbook, load_workbook

DATA_FILE = Path(__file__).resolve().parent / 'uploads' / 'Students_Directory_ALL_2026-09-27.xlsx'
USER_FILE = Path(__file__).resolve().parent / 'data' / 'users.json'
AUTHOR_FILE = Path(__file__).resolve().parent / 'data' / 'authors.xlsx'
STUDENT_FIELDS = ['id', 'fullName', 'branch', 'academicYear', 'cgpa', 'backlogs', 'codingScore', 'status', 'pipelineStage', 'company']

first_names = [
    'Palle', 'Aarav', 'Ananya', 'Rohan', 'Sanya', 'Vikram', 'Neha', 'Karan',
    'Priya', 'Aditya', 'Meera', 'Rahul', 'Divya', 'Siddharth', 'Kavya'
]
last_names = [
    'Kumar', 'Sharma', 'Verma', 'Patel', 'Reddy', 'Singh', 'Rao', 'Nair',
    'Joshi', 'Gupta', 'Chowdury', 'Das'
]
branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH']

companies = [
    {
        'id': 'c1',
        'name': 'Google',
        'logo': 'fa-brands fa-google',
        'role': 'Software Development Engineer',
        'ctc': '₹32.5 LPA',
        'minCgpa': 8.5,
        'maxBacklogs': 0,
        'branches': ['CSE', 'IT'],
        'appliedCount': 42,
    },
    {
        'id': 'c2',
        'name': 'Microsoft',
        'logo': 'fa-brands fa-microsoft',
        'role': 'Full Stack Engineer',
        'ctc': '₹28.0 LPA',
        'minCgpa': 8.0,
        'maxBacklogs': 0,
        'branches': ['CSE', 'IT', 'ECE'],
        'appliedCount': 58,
    },
    {
        'id': 'c3',
        'name': 'Amazon',
        'logo': 'fa-brands fa-amazon',
        'role': 'Systems Architect / SDE-1',
        'ctc': '₹26.0 LPA',
        'minCgpa': 7.5,
        'maxBacklogs': 0,
        'branches': ['CSE', 'IT', 'ECE', 'EEE'],
        'appliedCount': 64,
    },
    {
        'id': 'c4',
        'name': 'TCS Digital',
        'logo': 'fa-solid fa-code',
        'role': 'Digital Software Developer',
        'ctc': '₹7.5 LPA',
        'minCgpa': 6.5,
        'maxBacklogs': 1,
        'branches': ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
        'appliedCount': 95,
    },
    {
        'id': 'c5',
        'name': 'Infosys Power Programmer',
        'logo': 'fa-solid fa-laptop-code',
        'role': 'Specialist Programmer',
        'ctc': '₹9.5 LPA',
        'minCgpa': 7.0,
        'maxBacklogs': 0,
        'branches': ['CSE', 'IT', 'ECE'],
        'appliedCount': 78,
    },
]

random_seed = random.Random(42)


def infer_academic_year(student_id: str) -> str:
    match = re.search(r'20\d{2}', str(student_id))
    return match.group(0) if match else ''


def load_students_from_xlsx() -> List[Dict[str, Any]]:
    students: List[Dict[str, Any]] = []
    if not DATA_FILE.exists():
        return students

    try:
        workbook = load_workbook(DATA_FILE, read_only=True, data_only=True)
    except PermissionError as error:
        raise PermissionError(f'Close {DATA_FILE.name} in Excel before starting or using the placement portal.') from error
    try:
        worksheet = workbook.active
        rows = worksheet.iter_rows(values_only=True)
        headers = [str(value).strip() if value is not None else '' for value in next(rows, ())]
        for values in rows:
            row = dict(zip(headers, values))

            # Accept both the compact app schema and the original directory headings.
            student_id = row.get('id') or row.get('Student ID')
            if not student_id:
                continue

            status = str(row.get('status') or row.get('Status') or 'Unplaced').strip()
            stage = row.get('pipelineStage') or row.get('Pipeline Stage') or row.get('Interview Stage')
            if not stage:
                stage = 'Selected' if status.lower() == 'placed' else 'Technical Round' if status.lower() == 'in process' else 'Applied'

            students.append({
                'id': str(student_id).strip(),
                'fullName': str(row.get('fullName') or row.get('Full Name') or '').strip(),
                'branch': str(row.get('branch') or row.get('Branch') or '').strip(),
                'academicYear': str(row.get('academicYear') or row.get('Academic Year') or row.get('year') or row.get('Year') or infer_academic_year(student_id)).strip(),
                'cgpa': float(row.get('cgpa') or row.get('CGPA') or 0),
                'backlogs': int(row.get('backlogs') or row.get('Active Backlogs') or 0),
                'codingScore': int(row.get('codingScore') or row.get('Coding Score') or 0),
                'status': status,
                'pipelineStage': str(stage).strip(),
                'company': str(row.get('company') or row.get('Company') or '-').strip(),
            })
    finally:
        workbook.close()
    return distribute_in_process_stages(students)


def distribute_in_process_stages(students: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    in_process = [student for student in students if student['status'].lower() == 'in process']
    stages = {student['pipelineStage'] for student in in_process}
    pipeline_stages = ['Written Test', 'Technical Round', 'HR Round']

    # The source directory only says "In Process". If every such row has the
    # same default stage, spread them evenly so every pipeline stage is visible.
    if len(in_process) > 2 and len(stages) == 1 and next(iter(stages)) in pipeline_stages:
        for index, student in enumerate(in_process):
            student['pipelineStage'] = pipeline_stages[index % len(pipeline_stages)]
    return students


def save_students_to_xlsx(students: List[Dict[str, Any]]) -> None:
    if DATA_FILE.exists():
        workbook = load_workbook(DATA_FILE)
        worksheet = workbook.active
        headers = [str(cell.value or '').strip() for cell in worksheet[1]]
    else:
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = 'Students'
        headers = []

    aliases = {
        'id': {'id', 'student id'},
        'fullName': {'fullname', 'full name'},
        'branch': {'branch'},
        'academicYear': {'academicyear', 'academic year', 'year'},
        'cgpa': {'cgpa'},
        'backlogs': {'backlogs', 'active backlogs'},
        'codingScore': {'codingscore', 'coding score'},
        'status': {'status'},
        'pipelineStage': {'pipelinestage', 'pipeline stage', 'interview stage'},
        'company': {'company'},
    }
    columns = {}
    for field, names in aliases.items():
        for index, header in enumerate(headers, start=1):
            if header.casefold() in names:
                columns[field] = index
                break
        if field not in columns:
            headers.append(field)
            columns[field] = len(headers)
            worksheet.cell(row=1, column=columns[field], value=field)

    id_column = columns['id']
    row_by_id = {
        str(worksheet.cell(row=row_index, column=id_column).value).strip(): row_index
        for row_index in range(2, worksheet.max_row + 1)
        if worksheet.cell(row=row_index, column=id_column).value is not None
    }
    for student in students:
        student_id = str(student.get('id', '')).strip()
        row_index = row_by_id.get(student_id)
        if row_index is None:
            row_index = worksheet.max_row + 1
            row_by_id[student_id] = row_index
        for field, column in columns.items():
            value = student.get(field, '')
            worksheet.cell(row=row_index, column=column, value=value)

    worksheet.freeze_panes = 'A2'
    worksheet.auto_filter.ref = worksheet.dimensions
    for column, width in {'A': 18, 'B': 24, 'C': 14, 'D': 16, 'E': 10, 'F': 12, 'G': 14, 'H': 16, 'I': 20, 'J': 28, 'K': 28, 'L': 14}.items():
        worksheet.column_dimensions[column].width = width
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(DATA_FILE)


def generate_students() -> List[Dict[str, Any]]:
    students = load_students_from_xlsx()
    if students:
        return students

    students = []
    roll_counter = 101
    rounds = ['Applied', 'Written Test', 'Technical Round', 'HR Round', 'Selected']

    for _ in range(120):
        first_name = random_seed.choice(first_names)
        last_name = random_seed.choice(last_names)
        branch = random_seed.choice(branches)
        cgpa = round(random_seed.uniform(6.0, 10.0), 2)
        backlogs = random_seed.randint(0, 3) if random_seed.random() > 0.82 else 0
        coding_score = int(300 + (cgpa / 10.0) * 600 + random_seed.random() * 100)

        status = 'Unplaced'
        if cgpa > 7.5 and backlogs == 0 and random_seed.random() > 0.4:
            status = 'Placed'
        elif random_seed.random() > 0.6:
            status = 'In Process'

        stage = 'Applied'
        if status == 'Placed':
            stage = 'Selected'
        elif status == 'In Process':
            stage = rounds[random_seed.randint(1, 3)]

        students.append({
            'id': f'STU2026{roll_counter}',
            'fullName': f'{first_name} {last_name}',
            'branch': branch,
            'academicYear': '2026',
            'cgpa': cgpa,
            'backlogs': backlogs,
            'codingScore': coding_score,
            'status': status,
            'pipelineStage': stage,
            'company': random_seed.choice(companies)['name'] if status == 'Placed' else ('Google' if stage != 'Applied' else '-')
        })
        roll_counter += 1

    save_students_to_xlsx(students)
    return students


STUDENTS = generate_students()


def load_users() -> List[Dict[str, Any]]:
    if not USER_FILE.exists():
        default_users = [
            {'name': 'Demo User', 'email': 'user@test.com', 'password': '123456', 'role': 'user'},
        ]
        USER_FILE.parent.mkdir(parents=True, exist_ok=True)
        with USER_FILE.open('w', encoding='utf-8') as handle:
            json.dump(default_users, handle, indent=2)
        return default_users

    with USER_FILE.open('r', encoding='utf-8') as handle:
        users = json.load(handle)
    if not isinstance(users, list):
        return []
    return [user for user in users if isinstance(user, dict) and user.get('role') == 'user']


def save_users(users: List[Dict[str, Any]]) -> None:
    USER_FILE.parent.mkdir(parents=True, exist_ok=True)
    with USER_FILE.open('w', encoding='utf-8') as handle:
        json.dump([user for user in users if user.get('role') == 'user'], handle, indent=2)


def load_authors() -> List[Dict[str, Any]]:
    if not AUTHOR_FILE.exists():
        legacy_users = []
        if USER_FILE.exists():
            with USER_FILE.open('r', encoding='utf-8') as handle:
                stored_users = json.load(handle)
            if isinstance(stored_users, list):
                legacy_users = [user for user in stored_users if isinstance(user, dict) and user.get('role') == 'author']

        AUTHOR_FILE.parent.mkdir(parents=True, exist_ok=True)
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = 'Authors'
        worksheet.append(['name', 'email', 'password'])
        for author in legacy_users:
            worksheet.append([author.get('name', ''), author.get('email', ''), author.get('password', '')])
        worksheet.freeze_panes = 'A2'
        worksheet.auto_filter.ref = worksheet.dimensions
        worksheet.column_dimensions['A'].width = 24
        worksheet.column_dimensions['B'].width = 32
        worksheet.column_dimensions['C'].width = 24
        workbook.save(AUTHOR_FILE)
        if legacy_users:
            save_users(load_users())

    workbook = load_workbook(AUTHOR_FILE, read_only=True, data_only=True)
    try:
        worksheet = workbook.active
        rows = worksheet.iter_rows(values_only=True)
        headers = [str(value or '').strip().casefold() for value in next(rows, ())]
        authors = []
        for values in rows:
            row = dict(zip(headers, values))
            if not row.get('email') or not row.get('password'):
                continue
            authors.append({
                'name': str(row.get('name') or row.get('fullname') or '').strip(),
                'email': str(row['email']).strip(),
                'password': str(row['password']).strip(),
                'role': 'author',
            })
        return authors
    finally:
        workbook.close()


def get_company_by_id(company_id: str) -> Dict[str, Any]:
    for company in companies:
        if company['id'] == company_id:
            return company
    return companies[0]


def get_matcher_query(company: Dict[str, Any]) -> str:
    branches_sql = ', '.join(f"'{branch}'" for branch in company['branches'])
    return (
        f"SELECT s.full_name, s.branch, a.cgpa, a.active_backlogs\n"
        f"FROM Students s\n"
        f"JOIN AcademicRecords a ON s.student_id = a.student_id\n"
        f"WHERE a.cgpa >= {company['minCgpa']}\n"
        f"  AND a.active_backlogs <= {company['maxBacklogs']}\n"
        f"  AND s.branch IN ({branches_sql})\n"
        f"ORDER BY a.cgpa DESC;"
    )


def get_students_data() -> List[Dict[str, Any]]:
    global STUDENTS
    STUDENTS = load_students_from_xlsx()
    if not STUDENTS:
        STUDENTS = generate_students()
    return STUDENTS


def get_eligible_students(company: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [
        student for student in get_students_data()
        if student['cgpa'] >= company['minCgpa']
        and student['backlogs'] <= company['maxBacklogs']
        and student['branch'] in company['branches']
    ]


def get_matcher_payload(company_id: str) -> Dict[str, Any]:
    company = get_company_by_id(company_id)
    eligible = get_eligible_students(company)
    return {
        'company': company,
        'query': get_matcher_query(company),
        'eligible': eligible,
        'count': len(eligible),
    }


def get_ranking_query(mode: str) -> str:
    if mode == 'PARTITION_BRANCH':
        return (
            "SELECT full_name, branch, coding_score, cgpa,\n"
            "       DENSE_RANK() OVER (PARTITION BY branch ORDER BY coding_score DESC, cgpa DESC) as dense_rank_val,\n"
            "       ROW_NUMBER() OVER (PARTITION BY branch ORDER BY coding_score DESC, cgpa DESC) as row_num_val,\n"
            "       RANK()       OVER (PARTITION BY branch ORDER BY coding_score DESC) as rank_val\n"
            "FROM Students;"
        )

    return (
        "SELECT full_name, branch, coding_score, cgpa,\n"
        "       DENSE_RANK() OVER (ORDER BY coding_score DESC, cgpa DESC) as dense_rank_val,\n"
        "       ROW_NUMBER() OVER (ORDER BY coding_score DESC, cgpa DESC) as row_num_val,\n"
        "       RANK()       OVER (ORDER BY coding_score DESC) as rank_val\n"
        "FROM Students;"
    )


def get_ranked_students(mode: str) -> List[Dict[str, Any]]:
    ranked = list(get_students_data())

    if mode == 'PARTITION_BRANCH':
        ranked.sort(key=lambda item: (item['branch'], -item['codingScore'], -item['cgpa']))
    else:
        ranked.sort(key=lambda item: (-item['codingScore'], -item['cgpa']))

    rows: List[Dict[str, Any]] = []
    current_branch = ''
    dense_rank = 0
    row_number = 0
    prev_score = None
    items_in_group = 0

    for person in ranked:
        if mode == 'PARTITION_BRANCH' and person['branch'] != current_branch:
            current_branch = person['branch']
            dense_rank = 0
            prev_score = None
            items_in_group = 0

        row_number += 1
        items_in_group += 1

        if prev_score is None or person['codingScore'] != prev_score:
            dense_rank += 1
            prev_score = person['codingScore']
            rank_value = items_in_group
        else:
            rank_value = items_in_group

        rows.append({
            'fullName': person['fullName'],
            'branch': person['branch'],
            'codingScore': person['codingScore'],
            'cgpa': float(person['cgpa']),
            'denseRankVal': dense_rank,
            'rowNumVal': row_number,
            'rankVal': rank_value,
        })

    return rows


def get_rankings_payload(mode: str) -> Dict[str, Any]:
    normalized = 'PARTITION_BRANCH' if mode == 'PARTITION_BRANCH' else 'OVERALL'
    return {
        'query': get_ranking_query(normalized),
        'rows': get_ranked_students(normalized),
    }
