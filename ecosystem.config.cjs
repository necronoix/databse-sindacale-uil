module.exports = {
  apps: [
    {
      name: 'sindacato-anagrafica',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=sindacato-db --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        JWT_SECRET: 'super-secret-jwt-key-for-sindacato-roma-lazio-2024'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}