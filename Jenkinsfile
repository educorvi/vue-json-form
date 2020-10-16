pipeline {
  agent any
  stages {
    stage('Preparation') {
      parallel {
        stage('Dependencies') {
          steps {
            sh 'npm ci'
          }
        }

        stage('Information') {
          steps {
            sh 'node -v'
            sh 'npm -v'
          }
        }

      }
    }

    stage('Build & Test') {
      parallel {
        stage('Build NPM') {
          steps {
            sh 'npm run build:npm'
          }
        }

        stage('Build Demo') {
          steps {
            sh 'npm run build:demo'
          }
        }

        stage('Lint') {
          steps {
            sh 'npm run lint'
          }
        }

      }
    }

  }
}