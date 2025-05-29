// CommonJS script to start both servers
const { spawn } = require('child_process');
const path = require('path');

// Function to create a server process
function startServer(command, args, name) {
  console.log(`Starting ${name}...`);
  
  const serverProcess = spawn(command, args, {
    cwd: path.resolve(__dirname),
    shell: true,
    stdio: 'pipe'
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });
  
  return serverProcess;
}

// Start Express server
const expressServer = startServer('node', ['server.cjs'], 'Express Server');

// Start Vite development server
const viteServer = startServer('npm', ['run', 'dev'], 'Vite Dev Server');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  expressServer.kill();
  viteServer.kill();
  process.exit();
});

console.log('Both servers are now starting...');
console.log('Express API server will run on http://localhost:5000');
console.log('Vite development server will be available on the URL shown in the Vite output above');
