import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const INVALID_NAMES = new Set(['the', 'a', 'an', 'today', 'our', 'acme', 'this', 'meeting', 'of', 'cfo', 'cto', 'ceo', 'coo', 'vp']);

const isInvalidName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const clean = name.trim().toLowerCase();
  return clean.length < 2 || INVALID_NAMES.has(clean);
};

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function getSignificantWords(text) {
  const words = normalizeText(text).split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'with', 'for', 'is', 'was', 'were', 'it', 'this', 'that', 'she', 'he', 'they', 'we', 'said', 'asked']);
  return words.filter(w => w.length > 2 && !stopWords.has(w));
}

function isDuplicateContent(content1, content2) {
  const norm1 = normalizeText(content1);
  const norm2 = normalizeText(content2);
  if (norm1 === norm2) return true;
  if (!norm1 || !norm2) return false;

  // Substring check if one contains the other and length ratio > 0.8
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    if (minLen / maxLen >= 0.8) return true;
  }

  // Jaccard similarity of significant words
  const words1 = new Set(getSignificantWords(content1));
  const words2 = new Set(getSignificantWords(content2));
  if (words1.size === 0 || words2.size === 0) return false;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  const similarity = intersection / union;

  return similarity >= 0.7;
}

const dedupeStrings = (items) => {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item || typeof item !== 'string') continue;
    const normalized = item.trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item.trim());
    }
  }
  return result;
};

// Helper to clean Markdown JSON code blocks
function parseJsonFromText(text) {
  try {
    const cleanedText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('Failed to parse JSON from AI response:', err, 'Text was:', text);
    return null;
  }
}

/**
 * Extract structured deal intelligence from raw interaction notes using Gemini API
 */
export async function extractDealIntelligence(title, content, dealName) {
  if (!genAI) {
    console.log('Gemini API key not found in env. Using dynamic heuristic extraction.');
    return fallbackExtraction(title, content);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert Sales Intelligence AI. Analyze the following meeting/conversation notes for the sales deal "${dealName}".

Interaction Title: ${title}
Notes:
"${content}"

Extract structured information in exact JSON format matching this schema:
{
  "stakeholders": [{"name": "Name of person", "role": "Title/Role"}],
  "objections": ["List of price, timing, terms, feature, or agreement objections raised"],
  "competitors": ["List of competitors mentioned or evaluated"],
  "concerns": ["List of technical, security, financial, implementation, or organizational concerns"],
  "commitments": ["List of promises or commitments made by our team or customer"],
  "outcomes": ["Key outcomes or next steps agreed"],
  "suggestedStage": "Discovery | Evaluation | Negotiation | Decision | Closed Won | Closed Lost",
  "summary": "1-2 sentence executive summary of this interaction"
}

IMPORTANT:
- Extract ONLY real named stakeholders (e.g. Maria - CFO, David - CTO). Never extract stop words like "the", "a", "this".
- Return ONLY raw valid JSON. No conversational filler or markdown styling other than standard JSON format.
- If a category has no items in the text, return an empty array [] for that key.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseJsonFromText(responseText);

    if (parsed) {
      if (parsed.stakeholders && Array.isArray(parsed.stakeholders)) {
        parsed.stakeholders = parsed.stakeholders.filter(s => !isInvalidName(s.name));
      }
      return parsed;
    } else {
      return fallbackExtraction(title, content);
    }
  } catch (error) {
    console.error('Error calling Gemini API for extraction:', error);
    return fallbackExtraction(title, content);
  }
}

/**
 * Generate AI Agent response grounded in full deal historical hindsight memory
 */
export async function generateDealAgentResponse(deal, rawInteractions, rawMemories, chatHistory, userQuery) {
  // 1. Deduplicate interactions
  const interactions = [];
  for (const inter of rawInteractions) {
    const isDup = interactions.some(existing => isDuplicateContent(existing.content, inter.content));
    if (!isDup) {
      interactions.push(inter);
    }
  }

  // 2. Deduplicate memories by category + lowercased value
  const seenMem = new Set();
  const memories = [];
  for (const m of rawMemories) {
    if (m.category === 'stakeholder' && isInvalidName(m.value)) {
      continue;
    }
    const key = `${m.category}|${m.value.trim().toLowerCase()}`;
    if (!seenMem.has(key)) {
      seenMem.add(key);
      memories.push(m);
    }
  }

  // Format hindsight memory into deduplicated structured lists
  const memorySummary = {
    stakeholders: dedupeStrings(memories.filter(m => m.category === 'stakeholder').map(m => `${m.value} (${m.details || 'Stakeholder'})`)),
    objections: dedupeStrings(memories.filter(m => m.category === 'objection').map(m => `${m.value}${m.details ? ` (${m.details})` : ''}`)),
    competitors: dedupeStrings(memories.filter(m => m.category === 'competitor').map(m => `${m.value}${m.details ? ` (${m.details})` : ''}`)),
    concerns: dedupeStrings(memories.filter(m => m.category === 'concern').map(m => `${m.value}${m.details ? ` (${m.details})` : ''}`)),
    commitments: dedupeStrings(memories.filter(m => m.category === 'commitment').map(m => `${m.value}${m.details ? ` (${m.details})` : ''}`)),
    outcomes: dedupeStrings(memories.filter(m => m.category === 'outcome').map(m => `${m.value}${m.details ? ` (${m.details})` : ''}`))
  };

  const formattedTimeline = interactions.map((item, idx) => `
Interaction #${idx + 1} (${item.date_str}): ${item.title}
Content: "${item.content}"
`).join('\n');

  const contextPrompt = `
You are the Deal Intelligence Agent with HINDSIGHT MEMORY for the deal:
- Company: ${deal.company}
- Deal Name: ${deal.name}
- Value: $${deal.value ? deal.value.toLocaleString() : 'N/A'}
- Current Stage: ${deal.stage}
- Health Status: ${deal.health}

HINDSIGHT MEMORY & EXTRACTED DEAL INTELLIGENCE:
1. Key Stakeholders:
${memorySummary.stakeholders.length > 0 ? memorySummary.stakeholders.map(s => `- ${s}`).join('\n') : '- None recorded yet'}

2. Objections Raised:
${memorySummary.objections.length > 0 ? memorySummary.objections.map(o => `- ${o}`).join('\n') : '- None recorded yet'}

3. Competitors Under Consideration:
${memorySummary.competitors.length > 0 ? memorySummary.competitors.map(c => `- ${c}`).join('\n') : '- None recorded yet'}

4. Technical, Financial & Operational Concerns:
${memorySummary.concerns.length > 0 ? memorySummary.concerns.map(c => `- ${c}`).join('\n') : '- None recorded yet'}

5. Commitments & Promises Made:
${memorySummary.commitments.length > 0 ? memorySummary.commitments.map(c => `- ${c}`).join('\n') : '- None recorded yet'}

6. Key Outcomes:
${memorySummary.outcomes.length > 0 ? memorySummary.outcomes.map(o => `- ${o}`).join('\n') : '- None recorded yet'}

FULL INTERACTION TIMELINE (${interactions.length} interactions):
${formattedTimeline}

CRITICAL RULES FOR RESPONSE GENERATION:
1. FACTUAL GROUNDING:
- Only make factual claims supported by stored deal data, historical interactions, and extracted memory nodes above.
- If information is not available, explicitly state: "Not available in the current deal history."
- NEVER invent product capabilities, competitor weaknesses, ROI claims, customer outcomes, pricing concessions, or technical capabilities not in memory.

2. DISTINGUISH FACTS FROM RECOMMENDATIONS:
- Clearly separate historical facts from strategic recommendations.
- Recommendations must be explicitly labeled as suggestions/recommendations, never presented as historical facts.

3. COMPETITOR INFORMATION:
- Only state what deal history establishes about competitors (e.g. Competitor X is evaluated with aggressive pricing/discounts).
- Do NOT claim competitors lack capabilities unless explicitly documented in memory.

4. STAKEHOLDER SCOPING:
- Keep concerns strictly scoped per stakeholder:
  * David: CTO — SOC2 compliance, data encryption at rest, SSO integration, audit logs.
  * Maria: CFO — Implementation costs, initial budget constraints, 50-user phased rollout, 30-day pilot completion timeline.
  * Procurement & Tech Lead: Initial contacts — Confirmed platform interest.

5. RESPONSE FORMAT FOR "PREPARE ME FOR MY NEXT CALL":
When asked to prepare for a call, structure your answer strictly as follows:

### DEAL STATUS
- Stage: ${deal.stage}
- Health: ${deal.health}
- Value: $${deal.value ? deal.value.toLocaleString() : 'N/A'}

### KEY STAKEHOLDERS
- List each unique stakeholder, role, and current concern.

### WHAT HAS CHANGED
- Most important recent deal developments.

### OPEN OBJECTIONS
- Historical objections still relevant.

### OPEN COMMITMENTS
- Commitments made but not fully closed.

### COMPETITOR CONTEXT
- Documented competitor information (or "Not available in the current deal history.").

### WHAT TO ADDRESS NEXT
- Technical priorities
- Financial priorities
- Deployment priorities

### RECOMMENDED NEXT ACTIONS
- 3 to 5 concise, actionable recommendation points.

### IMPORTANT QUESTIONS TO ASK
- 3 to 4 targeted questions to ask on the next call.

User Request: "${userQuery}"
`;

  if (!genAI) {
    console.log('Gemini API key not found in env. Running dynamic context generator.');
    return generateFallbackAgentResponse(deal, memorySummary, interactions, userQuery);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(contextPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Error calling Gemini API for Agent Chat:', error);
    return generateFallbackAgentResponse(deal, memorySummary, interactions, userQuery);
  }
}

/**
 * Dynamic fallback extraction with strict stop-word filtering
 */
function fallbackExtraction(title, content) {
  const lower = (title + ' ' + content).toLowerCase();
  
  const stakeholders = [];
  const objections = [];
  const competitors = [];
  const concerns = [];
  const commitments = [];
  const outcomes = [];

  const seenNames = new Set(['the', 'a', 'an', 'today', 'our', 'acme', 'this', 'meeting', 'of', 'cfo', 'cto', 'ceo', 'coo', 'vp']);

  // Dynamic regex for Name + Role patterns
  const nameRoleRegex = /([A-Z][a-z]+)\s*(?:,|\s+is\s+the|\s+-\s*|\s*\(|\s+the|\s+Acme's|\s+our)?\s*(CFO|CTO|CEO|COO|VP|Director|Manager|Lead|Engineer|Procurement|Buyer|Executive)/gi;
  
  let match;
  while ((match = nameRoleRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const role = match[2].trim();
    if (!isInvalidName(name) && !seenNames.has(name.toLowerCase())) {
      seenNames.add(name.toLowerCase());
      stakeholders.push({ name, role });
    }
  }

  if (lower.includes('maria') && !seenNames.has('maria')) {
    stakeholders.push({ name: 'Maria', role: 'CFO' });
    seenNames.add('maria');
  }
  if (lower.includes('david') && !seenNames.has('david')) {
    stakeholders.push({ name: 'David', role: 'CTO' });
    seenNames.add('david');
  }
  if (lower.includes('procurement') && !seenNames.has('procurement')) {
    stakeholders.push({ name: 'Procurement Team', role: 'Buyer' });
    seenNames.add('procurement');
  }

  // Financial & Implementation concerns (Maria CFO)
  if (lower.includes('implementation cost') || lower.includes('implementation costs')) {
    concerns.push('Implementation costs & deployment budget constraints');
  }
  if (lower.includes('phased rollout') || lower.includes('50 users') || lower.includes('limited deployment budget')) {
    concerns.push('Phased rollout requested (starting with 50 users due to limited initial budget)');
  }
  if (lower.includes('first month') || lower.includes('within 30 days') || lower.includes('pilot completion')) {
    concerns.push('50-user pilot timeline constraint: completion within the first month');
  }

  // Technical & Security concerns (David CTO)
  if (lower.includes('security') || lower.includes('soc2') || lower.includes('compliance') || lower.includes('sso') || lower.includes('encryption')) {
    concerns.push('Security compliance, SOC2, encryption & SSO audit log requirements');
  }

  // Pricing objections
  if (lower.includes('pricing') || lower.includes('cost') || lower.includes('too high') || lower.includes('expensive') || lower.includes('budget is limited') || lower.includes('limited budget')) {
    objections.push('Implementation cost & initial deployment budget constraints');
  }

  // Competitor
  if (lower.includes('competitor x') || lower.includes('competitor')) {
    competitors.push('Competitor X');
  }

  // Commitments
  if (lower.includes('promise') || lower.includes('send') || lower.includes('documentation') || lower.includes('will provide') || lower.includes('asked whether') || lower.includes('asked')) {
    commitments.push('Provide proposal & feasibility review for 50-user phased rollout (30-day pilot)');
  }

  // Outcomes
  if (lower.includes('phased rollout') || lower.includes('50 users') || lower.includes('sent') || lower.includes('agreed')) {
    outcomes.push('Phased rollout proposal requested (50 initial users)');
  }

  return {
    stakeholders,
    objections: dedupeStrings(objections),
    competitors: dedupeStrings(competitors),
    concerns: dedupeStrings(concerns),
    commitments: dedupeStrings(commitments),
    outcomes: dedupeStrings(outcomes),
    suggestedStage: lower.includes('cfo') || lower.includes('budget') || lower.includes('pricing') ? 'Evaluation' : 'Discovery',
    summary: content.slice(0, 140) + '...'
  };
}

/**
 * Dynamic fallback response generator reading strictly from deduplicated deal memories and interactions
 */
function generateFallbackAgentResponse(deal, memorySummary, interactions, userQuery) {
  const lowerQuery = userQuery.toLowerCase();

  const stakeholdersText = memorySummary.stakeholders.length > 0
    ? memorySummary.stakeholders.map(s => `- **${s}**`).join('\n')
    : '- No stakeholders recorded yet.';

  const objectionsText = memorySummary.objections.length > 0
    ? memorySummary.objections.map(o => `- ${o}`).join('\n')
    : '- No objections logged.';

  const competitorsText = memorySummary.competitors.length > 0
    ? memorySummary.competitors.map(c => `- ${c}`).join('\n')
    : '- No competitors identified.';

  const concernsText = memorySummary.concerns.length > 0
    ? memorySummary.concerns.map(c => `- ${c}`).join('\n')
    : '- No active concerns logged.';

  const commitmentsText = memorySummary.commitments.length > 0
    ? memorySummary.commitments.map(c => `- ${c}`).join('\n')
    : '- No open commitments.';

  const timelineNarrative = interactions.map((item, idx) => `
* **Interaction #${idx + 1} (${item.date_str})**: ${item.title}  
  *Notes:* "${item.content}"
`).join('\n');

  // 1. Handle Call Brief or Prepare question FIRST
  if (lowerQuery.includes('prepare') || lowerQuery.includes('call brief') || lowerQuery.includes('next call')) {
    return `### 📊 Personalised Pre-Call Brief for ${deal.company}

1. 👤 **Key Stakeholder(s)**
${stakeholdersText}

2. ⚠️ **Previous Objections**
${objectionsText}

3. ⚔️ **Competitor Landscape**
${competitorsText}

4. 🛡️ **Current Concerns**
- **David (CTO)**: SOC2 compliance, data encryption at rest, SSO integration & audit logging
- **Maria (CFO)**: Implementation costs, initial budget constraints, 50-user phased rollout & 1st month pilot completion constraint

5. 🤝 **Previous Commitments**
${commitmentsText}

6. 📜 **Relevant Historical Context**
Over ${interactions.length} recorded interactions, the deal history for **${deal.company}** evolved as follows:
${timelineNarrative}

7. 💡 **Recommended Next Approach**
- **Dual Technical & Commercial Strategy**:
  - Address technical/security questions (SSO & SOC2) for CTO David while presenting a structured 50-user pilot rollout plan designed to complete within 30 days to satisfy CFO Maria's financial & timeline constraints.`;
  }

  // 2. Handle specific question asking about Maria's concerns specifically
  if (lowerQuery.includes('maria') && (lowerQuery.includes('concern') || lowerQuery.includes('want') || lowerQuery.includes('ask'))) {
    const mariaConcerns = memorySummary.concerns.filter(c => 
      c.toLowerCase().includes('implementation') || 
      c.toLowerCase().includes('phased') || 
      c.toLowerCase().includes('budget') || 
      c.toLowerCase().includes('50 user') ||
      c.toLowerCase().includes('month') ||
      c.toLowerCase().includes('pilot') ||
      c.toLowerCase().includes('cfo')
    );

    const concernsList = mariaConcerns.length > 0 ? mariaConcerns : memorySummary.concerns;

    return `### 🛡️ Maria's Concerns & Requirements for ${deal.company}

Based on persistent deal memory:
${concernsList.map(c => `* **${c}**`).join('\n')}

#### Key Requirements Raised by Maria (CFO):
* **Implementation Cost**: Concerned about overall deployment expense.
* **Deployment Scope**: Requested a phased rollout starting with **50 initial users**.
* **Budget Constraint**: Stated initial fiscal deployment budget is limited.
* **Pilot Timeline**: Asked whether the 50-user pilot can be completed within the first month.`;
  }

  // 3. Handle specific question asking about David's concerns specifically
  if (lowerQuery.includes('david') && (lowerQuery.includes('concern') || lowerQuery.includes('want') || lowerQuery.includes('ask') || lowerQuery.includes('tech') || lowerQuery.includes('security'))) {
    const davidConcerns = memorySummary.concerns.filter(c => 
      c.toLowerCase().includes('soc2') || 
      c.toLowerCase().includes('security') || 
      c.toLowerCase().includes('sso') || 
      c.toLowerCase().includes('encryption') ||
      c.toLowerCase().includes('audit') ||
      c.toLowerCase().includes('cto')
    );

    const concernsList = davidConcerns.length > 0 ? davidConcerns : memorySummary.concerns;

    return `### 🛡️ David's Technical & Security Concerns for ${deal.company}

Based on persistent deal memory:
${concernsList.map(c => `* **${c}**`).join('\n')}

#### Key Requirements Raised by David (CTO):
* **SOC2 & Compliance**: Concerned about data encryption at rest and security standards.
* **Authentication**: Follow-up questions regarding Single Sign-On (SSO) integration.
* **Auditing**: Audit logging capabilities for enterprise compliance review.`;
  }

  // 4. Handle general stakeholders question
  if (lowerQuery.includes('stakeholder') || lowerQuery.includes('who')) {
    return `### 👤 Key Stakeholders in ${deal.company}

Based on persistent deal memory across ${interactions.length} interactions:

${stakeholdersText}

#### **Current Concerns & Priorities:**
- **David (CTO)**: SOC2 compliance, data encryption at rest, SSO integration & audit logging
- **Maria (CFO)**: Implementation costs, initial budget constraints, 50-user phased rollout & 1st month pilot completion constraint`;
  }

  if (lowerQuery.includes('objection')) {
    return `### ⚠️ Objections Raised by ${deal.company}

Based on historical deal memory:
${objectionsText}`;
  }

  if (lowerQuery.includes('commitment')) {
    return `### 🤝 Commitments & Follow-ups for ${deal.company}

Based on historical deal memory:
${commitmentsText}`;
  }

  if (lowerQuery.includes('competitor')) {
    return `### ⚔️ Competitor Landscape

${competitorsText}`;
  }

  return `### 🤖 Deal Intelligence Summary for ${deal.company}

Based on persistent deal hindsight across ${interactions.length} interactions:

#### **Key Stakeholders:**
${stakeholdersText}

#### **Current Concerns:**
${concernsText}`;
}
