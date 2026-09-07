const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let depth = 0;
let lines = code.split('\n');
let appStarted = false;
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('export default function App() {')) {
    appStarted = true;
  }
  
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') {
      depth--;
    }
  }
  
  if (appStarted && depth === 0 && i < lines.length - 2) {
    console.log(`App closed early at line ${i + 1}`);
    console.log(line);
    process.exit(1);
  }
}
