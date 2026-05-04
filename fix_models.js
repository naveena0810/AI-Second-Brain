const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src/app/api');

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // We want to replace the models array definition
    // It usually starts with `const models = [` and ends with `];`
    const regex = /const models = \[\s*\{[\s\S]*?\];/g;
    
    let newContent = content.replace(regex, 
`const models = [
      { id: "meta/llama-3.1-8b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];`);
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf-8');
        console.log('Updated models array in', file);
        changedCount++;
    }
});

console.log('Total files updated:', changedCount);
