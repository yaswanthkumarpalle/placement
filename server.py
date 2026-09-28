from pathlib import Path

import os
import secrets

from flask import Flask, jsonify, request, send_from_directory, session

from queries import (
    companies,
    get_matcher_payload,
    get_rankings_payload,
    get_students_data,
    load_authors,
    load_users,
    save_students_to_xlsx,
    save_users,
)

PORT = 8000
DIRECTORY = Path(__file__).resolve().parent

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY') or secrets.token_hex(32)
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax')


@app.after_request
def disable_client_caching(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.route('/')
def index():
    return send_from_directory(str(DIRECTORY), 'index.html')


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(str(DIRECTORY), filename)


@app.route('/api/companies')
def api_companies():
    return jsonify(companies)


@app.route('/api/users')
def api_users():
    return jsonify([{key: user.get(key) for key in ('name', 'email', 'role')} for user in load_users()])


@app.route('/api/users', methods=['POST'])
def api_create_user():
    payload = request.get_json(silent=True) or {}
    if payload.get('role') != 'user':
        return jsonify({'status': 'forbidden', 'message': 'Only user accounts can be created here.'}), 403
    users = load_users()
    email = str(payload.get('email', '')).strip().lower()
    if not payload.get('name') or not email or not payload.get('password'):
        return jsonify({'status': 'invalid', 'message': 'Name, email, and password are required.'}), 400
    if any(str(user.get('email', '')).lower() == email for user in users):
        return jsonify({'status': 'duplicate', 'message': 'This email already has a user account.'}), 409
    payload['email'] = email
    users.append(payload)
    save_users(users)
    user = {key: payload.get(key) for key in ('name', 'email', 'role')}
    session['user'] = user
    return jsonify({'status': 'success', 'user': user, 'users': [{key: item.get(key) for key in ('name', 'email', 'role')} for item in users]})


@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()
    password = str(payload.get('password', ''))
    role = payload.get('role')
    try:
        accounts = load_authors() if role == 'author' else load_users() if role == 'user' else []
    except PermissionError:
        return jsonify({
            'status': 'unavailable',
            'message': 'Close data/authors.xlsx in Excel and try signing in again.',
        }), 503
    account = next((user for user in accounts if user.get('email', '').lower() == email and user.get('password') == password), None)
    if not account:
        return jsonify({'status': 'invalid', 'message': 'Invalid role, email, or password.'}), 401

    user = {key: account.get(key) for key in ('name', 'email', 'role')}
    session['user'] = user
    return jsonify({'status': 'success', 'user': user})


@app.route('/api/auth/session')
def api_auth_session():
    user = session.get('user')
    if not user:
        return jsonify({'status': 'signed_out'}), 401
    return jsonify({'status': 'success', 'user': user})


@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    session.clear()
    return jsonify({'status': 'success'})


@app.route('/api/students')
def api_students():
    return jsonify(get_students_data())


@app.route('/api/students', methods=['POST'])
def api_add_student():
    if session.get('user', {}).get('role') != 'author':
        return jsonify({'status': 'forbidden', 'message': 'Author access is required to add student records.'}), 403

    try:
        payload = request.get_json(silent=True) or {}
        required_fields = ['id', 'fullName', 'branch', 'academicYear']
        if any(not str(payload.get(field, '')).strip() for field in required_fields):
            return jsonify({'status': 'invalid', 'message': 'Student ID, name, branch, and academic year are required.'}), 400

        students = get_students_data()
        if any(student.get('id') == str(payload['id']).strip() for student in students):
            return jsonify({'status': 'duplicate', 'message': 'A student with this ID already exists.'}), 409
        payload['id'] = str(payload['id']).strip()
        payload['academicYear'] = str(payload['academicYear']).strip()
        payload.setdefault('status', 'Unplaced')
        payload.setdefault('pipelineStage', 'Applied')
        payload.setdefault('company', '-')
        payload['cgpa'] = float(payload.get('cgpa') or 0)
        payload['backlogs'] = int(payload.get('backlogs') or 0)
        payload['codingScore'] = int(payload.get('codingScore') or 0)
        students.append(payload)
        save_students_to_xlsx(students)
        return jsonify({'status': 'success', 'data': students})
    except (TypeError, ValueError) as error:
        return jsonify({'status': 'invalid', 'message': str(error)}), 400
    except Exception as error:
        app.logger.exception('Unable to save a student record')
        return jsonify({
            'status': 'error',
            'message': 'Unable to save the student record.',
            'detail': str(error),
        }), 500


@app.route('/api/students/<student_id>', methods=['PUT'])
def api_update_student(student_id):
    payload = request.get_json(silent=True) or {}
    students = get_students_data()
    updated = []
    found = False
    for student in students:
        if student.get('id') == student_id:
            student.update(payload)
            found = True
        updated.append(student)
    if not found:
        return jsonify({'status': 'not_found'}), 404
    save_students_to_xlsx(updated)
    return jsonify({'status': 'success', 'data': updated})


@app.route('/api/students/<student_id>', methods=['DELETE'])
def api_delete_student(student_id):
    students = get_students_data()
    filtered = [student for student in students if student.get('id') != student_id]
    if len(filtered) == len(students):
        return jsonify({'status': 'not_found'}), 404
    save_students_to_xlsx(filtered)
    return jsonify({'status': 'success', 'data': filtered})


@app.route('/api/matcher/<company_id>')
def api_matcher(company_id):
    return jsonify(get_matcher_payload(company_id))


@app.route('/api/rankings/<mode>')
def api_rankings(mode):
    return jsonify(get_rankings_payload(mode))


if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except KeyboardInterrupt:
        print('\nServer stopped by user.')
