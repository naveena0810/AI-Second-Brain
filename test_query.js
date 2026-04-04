const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/KIMI_API_KEY=(.*)/);
if (!match) return console.log('No key found');
const KIMI_API_KEY = match[1].trim();

const activePerspectiveTone = 'friendly, no jargon, step-by-step for someone brand new to the topic';
const activePerspectiveLabel = '📘 Beginner';

const systemPrompt = `You are an intelligent teaching assistant.
Current Perspective Mode: ${activePerspectiveLabel}
Adjust your ENTIRE response — language, tone, vocabulary, complexity, and examples — to be ${activePerspectiveTone}.

Respond using the following Markdown format (do not use literal square brackets, replace the content):

Provide a single introductory sentence tailored to the ${activePerspectiveLabel} perspective.

### 🧠 Simple Definition
Provide a clear definition suited to this perspective, with 3-4 bullet points.

---

### ✅ Real-Life Examples
1. (Relevant emoji) **(Example Category Name)**
   - Examples: (Specific examples)
   - (Brief explanation)
   👉 **Example:** (A specific, relatable scenario appropriate for the ${activePerspectiveLabel} perspective)

Rule: Base your answer on the provided context. Keep all language consistent with the ${activePerspectiveLabel} perspective throughout.`;

(async () => {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + KIMI_API_KEY,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'What is ML?' }
      ]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
})();
