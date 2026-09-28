pipeline {
    agent any

    environment {
        APP_NAME = 'placement-portal'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/YOUR_USERNAME/YOUR_REPO.git'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'python3 -m venv venv'
                sh '. venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt'
            }
        }

        stage('Test') {
            steps {
                sh '. venv/bin/activate && python -m compileall .'
            }
        }

        stage('Build Docker image') {
            steps {
                sh 'docker build -t ${APP_NAME}:${IMAGE_TAG} .'
            }
        }

        stage('Deploy to AWS') {
            steps {
                sh '''
                    echo "Deploying to AWS EC2 or ECS here..."
                    echo "Example: docker run -d -p 8000:8000 ${APP_NAME}:${IMAGE_TAG}"
                '''
            }
        }
    }
}
