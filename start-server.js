import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the Express server
console.log('Starting Express server...');
const server = exec('node server.js', {
  cwd: path.resolve(__dirname)
});

server.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server Error: ${data}`);
});

// Start the Vite development server
console.log('Starting Vite development server...');
const vite = exec('npm run dev', {
  cwd: path.resolve(__dirname)
});

vite.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

vite.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

console.log('Both servers are now running!');
console.log('Express API server is running on http://localhost:5000');
console.log('Vite development server will be available on the URL shown in the Vite output above');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  server.kill();
  vite.kill();
  process.exit();
});
