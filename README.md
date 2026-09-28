# Placement Portal

This project is a Flask-based placement portal with login, role-based access, and author CRUD functionality.

## Local run

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
python server.py
```

Open: http://localhost:8000

## Accounts

User accounts can be created from the sign-up screen. Author accounts are created by the developer in `data/authors.xlsx`; the application creates this workbook on first start if it does not exist. Add one author per row under the headers `name`, `email`, and `password`, then restart the server (or sign in again). Authors use the Author sign-in screen; there is no author sign-up option. Keep the workbook closed in Excel while signing in so Windows does not lock it.

## AWS deployment

1. Launch an EC2 Ubuntu instance.
2. Install Docker and Git on the server.
3. Upload this project to GitHub or use a Git repo.
4. Run:

```bash
chmod +x aws-deploy.sh
./aws-deploy.sh
```

Or build and run with Docker:

```bash
docker build -t placement-portal .
docker run -d -p 8000:8000 placement-portal
```

## Jenkins pipeline

The included `Jenkinsfile` checks out the repo, installs dependencies, runs a basic syntax check, builds the Docker image, and prepares deployment steps for AWS.

Update the GitHub URL in the Jenkinsfile before use:

```groovy
git branch: 'main', url: 'https://github.com/YOUR_USERNAME/YOUR_REPO.git'
```
