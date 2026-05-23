const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/billing/BillingPage.jsx', 'utf8');

// Match all opening <div and closing </div tags
// Note: This is a simple regex that assumes no <div inside strings
let openCount = 0;
let tags = [];

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignore comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        continue;
    }
    
    // count <div (but not <div/>)
    const opens = (line.match(/<div(?=[\s>])/g) || []).length;
    // count </div>
    const closes = (line.match(/<\/div>/g) || []).length;
    
    openCount += opens;
    openCount -= closes;
    
    if (opens > 0 || closes > 0) {
        tags.push({ line: i + 1, opens, closes, current: openCount, text: line.trim() });
    }
}

console.log("Final div depth:", openCount);
console.log("Last 20 tag lines:");
for (let i = Math.max(0, tags.length - 20); i < tags.length; i++) {
    console.log(`L${tags[i].line} [Depth: ${tags[i].current}] (+${tags[i].opens}/-${tags[i].closes}) ${tags[i].text.substring(0, 50)}`);
}

