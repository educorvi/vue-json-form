pipeline {
  agent {
    docker {
      image 'node'
    }

  }
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
            sh 'npm run zip:npm'
            archiveArtifacts 'dist.zip'
          }
        }

        stage('Build Demo') {
          steps {
            sh 'npm run build:demo'
            sh 'npm run zip:demo'
            archiveArtifacts 'demoDist.zip'
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
  environment {
    HOME = '.'
  }
}
