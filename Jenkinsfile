pipeline {
  agent {
    docker {
      image 'cypress/included'
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
    stage('Test') {
        steps {
            sh 'npm test'
        }
    }
    stage('Build') {
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
            archiveArtifacts 'demo.zip'
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

  post {
      always {
          archiveArtifacts 'cypress/videos/*'
          archiveArtifacts 'cypress/screenshots/*'
          junit 'test-results.xml'
      }
   }

  environment {
    HOME = '.'
  }
}
