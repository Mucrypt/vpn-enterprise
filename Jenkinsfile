pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_PREFIX = 'vpn-enterprise'
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git rev-parse --short HEAD > .git/commit-id'
                script {
                    env.GIT_COMMIT_SHORT = readFile('.git/commit-id').trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Lint') {
            parallel {
                stage('Lint Node API') {
                    steps {
                        sh 'npm run lint --workspace=@vpn-enterprise/api'
                    }
                }
                stage('Lint Web Dashboard') {
                    steps {
                        sh 'cd apps/web-dashboard && npm run lint'
                    }
                }
                stage('Lint Python API') {
                    steps {
                        sh 'cd flask && pip install flake8 && flake8 app.py'
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Test Node API') {
                    steps {
                        sh 'npm test --workspace=@vpn-enterprise/api'
                    }
                }
                stage('Test Web Dashboard') {
                    steps {
                        sh 'cd apps/web-dashboard && npm test'
                    }
                }
                stage('Test Python API') {
                    steps {
                        sh 'cd flask && pip install pytest && pytest'
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Build Node API') {
                    steps {
                        sh 'npm run build --workspace=@vpn-enterprise/api'
                    }
                }
                stage('Build Web Dashboard') {
                    steps {
                        sh 'cd apps/web-dashboard && npm run build'
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            when {
                branch 'main'
            }
            parallel {
                stage('Build API Image') {
                    steps {
                        sh """
                            docker build -t ${IMAGE_PREFIX}-api:${GIT_COMMIT_SHORT} \
                                -t ${IMAGE_PREFIX}-api:latest \
                                -f infrastructure/docker/Dockerfile.api .
                        """
                    }
                }
                stage('Build Web Image') {
                    steps {
                        sh """
                            docker build -t ${IMAGE_PREFIX}-web:${GIT_COMMIT_SHORT} \
                                -t ${IMAGE_PREFIX}-web:latest \
                                -f infrastructure/docker/Dockerfile.web .
                        """
                    }
                }
                stage('Build Python API Image') {
                    steps {
                        sh """
                            docker build -t ${IMAGE_PREFIX}-python-api:${GIT_COMMIT_SHORT} \
                                -t ${IMAGE_PREFIX}-python-api:latest \
                                -f flask/Dockerfile .
                        """
                    }
                }
            }
        }
        
        stage('Security Scan') {
            when {
                branch 'main'
            }
            steps {
                sh 'trivy image ${IMAGE_PREFIX}-api:latest || true'
                sh 'trivy image ${IMAGE_PREFIX}-web:latest || true'
                sh 'trivy image ${IMAGE_PREFIX}-python-api:latest || true'
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push ${IMAGE_PREFIX}-api:${GIT_COMMIT_SHORT}'
                    sh 'docker push ${IMAGE_PREFIX}-api:latest'
                    sh 'docker push ${IMAGE_PREFIX}-web:${GIT_COMMIT_SHORT}'
                    sh 'docker push ${IMAGE_PREFIX}-web:latest'
                    sh 'docker push ${IMAGE_PREFIX}-python-api:${GIT_COMMIT_SHORT}'
                    sh 'docker push ${IMAGE_PREFIX}-python-api:latest'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    cd infrastructure/docker
                    docker compose -f docker-compose.dev.yml pull
                    docker compose -f docker-compose.dev.yml up -d
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    cd infrastructure/docker
                    docker compose -f docker-compose.prod.yml pull
                    docker compose -f docker-compose.prod.yml up -d --no-deps
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
            // Add notification here (Slack, Email, etc.)
        }
        failure {
            echo 'Pipeline failed!'
            // Add notification here
        }
    }
}
