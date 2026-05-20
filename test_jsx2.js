const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/billing/BillingPage.jsx', 'utf8');
let openCount = 0;
let lastDepth1 = -1;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;
    
    const opens = (line.match(/<[a-zA-Z]+/g) || []).filter(m => !m.match(/<br|<hr|<input|<img/)).length;
    const closes = (line.match(/<\/[a-zA-Z]+/g) || []).length;
    // self-closing tags like <Search /> are matched by opens but not closes... wait, regex is hard for JSX.
}
