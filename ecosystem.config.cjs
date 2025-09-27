module.exports = {
  apps: [
    {
      name: 'sindacato-roma-lazio',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=sindacato-roma-lazio-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        JWT_SECRET: 'your-jwt-secret-key-change-in-production'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}