module.exports = {
  apps: [{
    name: 'velocity',
    cwd: '/var/www/velocity',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    kill_timeout: 5000,
    wait_ready: false,
    max_restarts: 3,
    restart_delay: 2000,
  }]
}
