const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/KIMI_API_KEY=(.*)/);
if (!match) return console.log('No key found');
const KIMI_API_KEY = match[1].trim();

const systemPrompt = `You are an expert educator. Your task is to generate a high-quality quiz...`;
const userPrompt = `Generate a medium difficulty quiz based on this content:\n\nTesting ML concepts content`;

(async () => {
  const controller = new AbortController();
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + KIMI_API_KEY,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2500,
      temperature: 0.7,
    })
  });
  console.log('Status: ', res.status);
  const text = await res.text();
  console.log('Body: ', text);
})();
