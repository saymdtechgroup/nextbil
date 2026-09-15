const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "return JSON.parse(stored);",
  "// return JSON.parse(stored); // Disabled local cache to trust backend completely"
);
fs.writeFileSync('src/App.tsx', app);
