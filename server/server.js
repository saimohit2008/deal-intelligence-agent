import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, seedDemoData } from './db.js';
import { extractDealIntelligence, generateDealAgentResponse } from './geminiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

  return similarity >= 0.65; // 65% similarity threshold
}

function dedupeInteractionsList(rawInteractions) {
  const result = [];
  for (const inter of rawInteractions) {
    const isDup = result.some(existing => isDuplicateContent(existing.content, inter.content));
    if (!isDup) {
      result.push(inter);
    }
  }
  return result;
}

async function cleanupDuplicateInteractions(db, dealId) {
  try {
    const rawInteractions = await db.all(
      'SELECT * FROM interactions WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    const seen = [];
    const dupsToDelete = [];

    for (const inter of rawInteractions) {
      const isDup = seen.some(existing => isDuplicateContent(existing.content, inter.content));
      if (isDup) {
        dupsToDelete.push(inter.id);
      } else {
        seen.push(inter);
      }
    }

    if (dupsToDelete.length > 0) {
      console.log(`Cleaning up ${dupsToDelete.length} duplicate interaction database rows for deal #${dealId}:`, dupsToDelete);
      for (const dupId of dupsToDelete) {
        await db.run('DELETE FROM interactions WHERE id = ?', [dupId]);
        await db.run('DELETE FROM memories WHERE interaction_id = ?', [dupId]);
      }
    }
  } catch (err) {
    console.error('Error during duplicate interaction cleanup:', err);
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/deals - List deals and overall pipeline metrics
app.get('/api/deals', async (req, res) => {
  try {
    const db = await getDb();
    const deals = await db.all('SELECT * FROM deals ORDER BY updated_at DESC');
    
    // Calculate aggregate metrics
    const totalDeals = deals.length;
    const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
    const atRiskDeals = deals.filter(d => d.health === 'At Risk').length;
    const totalPipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);

    // Get recent activity across all deals
    const rawActivity = await db.all(`
      SELECT i.*, d.name as deal_name, d.company
      FROM interactions i
      JOIN deals d ON i.deal_id = d.id
      ORDER BY i.created_at DESC
    `);

    // Deduplicate recent activity timeline
    const recentActivity = dedupeInteractionsList(rawActivity).slice(0, 6);

    res.json({
      deals,
      metrics: {
        totalDeals,
        activeDeals,
        atRiskDeals,
        totalPipelineValue
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// GET /api/deals/:id - Fetch single deal with complete hindsight memory timeline
app.get('/api/deals/:id', async (req, res) => {
  try {
    const db = await getDb();
    const dealId = req.params.id;

    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Run duplicate cleanup on DB
    await cleanupDuplicateInteractions(db, dealId);

    const rawInteractions = await db.all(
      'SELECT * FROM interactions WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    // Deduplicate interactions
    const interactions = dedupeInteractionsList(rawInteractions);

    const rawMemories = await db.all(
      'SELECT * FROM memories WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    // Deduplicate memories by category + lowercased value
    const seenMemKeys = new Set();
    const memoriesList = [];
    for (const mem of rawMemories) {
      if (mem.category === 'stakeholder' && isInvalidName(mem.value)) {
        continue;
      }
      const key = `${mem.category}|${mem.value.trim().toLowerCase()}`;
      if (!seenMemKeys.has(key)) {
        seenMemKeys.add(key);
        memoriesList.push(mem);
      }
    }

    // Group memories by category for quick UI consumption
    const groupedMemories = {
      stakeholders: memoriesList.filter(m => m.category === 'stakeholder'),
      objections: memoriesList.filter(m => m.category === 'objection'),
      competitors: memoriesList.filter(m => m.category === 'competitor'),
      concerns: memoriesList.filter(m => m.category === 'concern'),
      commitments: memoriesList.filter(m => m.category === 'commitment'),
      outcomes: memoriesList.filter(m => m.category === 'outcome')
    };

    res.json({
      deal,
      interactions,
      memories: groupedMemories,
      allMemories: memoriesList
    });
  } catch (error) {
    console.error('Error fetching deal details:', error);
    res.status(500).json({ error: 'Failed to fetch deal details' });
  }
});

// POST /api/deals - Create a new deal
app.post('/api/deals', async (req, res) => {
  try {
    const { name, company, value, stage, health, summary } = req.body;
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and Company are required' });
    }

    const db = await getDb();
    const result = await db.run(`
      INSERT INTO deals (name, company, value, stage, health, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      company,
      value || 0,
      stage || 'Discovery',
      health || 'Medium',
      summary || ''
    ]);

    const newDeal = await db.get('SELECT * FROM deals WHERE id = ?', [result.lastID]);
    res.status(201).json(newDeal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// POST /api/deals/:id/interactions - Add interaction with sensible duplicate detection
app.post('/api/deals/:id/interactions', async (req, res) => {
  try {
    const db = await getDb();
    const dealId = req.params.id;
    const { title, content, date_str } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Clean existing duplicates first
    await cleanupDuplicateInteractions(db, dealId);

    // Check if duplicate interaction already exists (exact or high content similarity)
    const existingInteractions = await db.all(
      'SELECT id, title, content FROM interactions WHERE deal_id = ?',
      [dealId]
    );

    const matchInter = existingInteractions.find(existing => 
      isDuplicateContent(existing.content, content)
    );

    if (matchInter) {
      console.log(`Duplicate interaction detected for deal #${dealId}. Reusing existing interaction #${matchInter.id}`);
      return res.status(200).json({
        message: 'Duplicate interaction detected. Existing interaction reused.',
        interaction: matchInter,
        savedMemories: []
      });
    }

    const interactionResult = await db.run(`
      INSERT INTO interactions (deal_id, title, content, date_str)
      VALUES (?, ?, ?, ?)
    `, [dealId, title.trim(), content.trim(), date_str || `Day ${Date.now()}`]);
    const interactionId = interactionResult.lastID;

    // AI Intelligence Extraction
    console.log(`Analyzing interaction #${interactionId} for ${deal.company}...`);
    const extracted = await extractDealIntelligence(title, content, deal.company);

    // Save extracted memories to database with deduplication checks
    const savedMemories = [];

    const saveMemoryCategory = async (category, value, details) => {
      if (!value || typeof value !== 'string') return;
      const cleanVal = value.trim();
      if (!cleanVal) return;

      if (category === 'stakeholder' && isInvalidName(cleanVal)) {
        return; // Reject malformed placeholder names like "the"
      }

      // Check if memory already exists for this deal & category & value
      const existingMem = await db.get(
        'SELECT id FROM memories WHERE deal_id = ? AND category = ? AND LOWER(value) = LOWER(?)',
        [dealId, category, cleanVal]
      );

      if (!existingMem) {
        await db.run(`
          INSERT INTO memories (deal_id, interaction_id, category, value, details)
          VALUES (?, ?, ?, ?, ?)
        `, [dealId, interactionId, category, cleanVal, details || '']);
        savedMemories.push({ category, value: cleanVal, details });
      }
    };

    // Stakeholders
    if (extracted.stakeholders && Array.isArray(extracted.stakeholders)) {
      for (const sh of extracted.stakeholders) {
        await saveMemoryCategory('stakeholder', sh.name, sh.role);
      }
    }

    // Objections
    if (extracted.objections && Array.isArray(extracted.objections)) {
      for (const obj of extracted.objections) {
        await saveMemoryCategory('objection', obj, title);
      }
    }

    // Competitors
    if (extracted.competitors && Array.isArray(extracted.competitors)) {
      for (const comp of extracted.competitors) {
        await saveMemoryCategory('competitor', comp, title);
      }
    }

    // Concerns
    if (extracted.concerns && Array.isArray(extracted.concerns)) {
      for (const concern of extracted.concerns) {
        await saveMemoryCategory('concern', concern, title);
      }
    }

    // Commitments
    if (extracted.commitments && Array.isArray(extracted.commitments)) {
      for (const commit of extracted.commitments) {
        await saveMemoryCategory('commitment', commit, title);
      }
    }

    // Outcomes
    if (extracted.outcomes && Array.isArray(extracted.outcomes)) {
      for (const out of extracted.outcomes) {
        await saveMemoryCategory('outcome', out, title);
      }
    }

    // Optionally update deal stage if AI suggests one
    if (extracted.suggestedStage) {
      await db.run(`
        UPDATE deals SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [extracted.suggestedStage, dealId]);
    } else {
      await db.run(`UPDATE deals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [dealId]);
    }

    res.status(201).json({
      interaction: {
        id: interactionId,
        deal_id: dealId,
        title,
        content,
        date_str
      },
      extracted,
      savedMemories
    });
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({ error: 'Failed to process interaction' });
  }
});

// GET /api/deals/:id/chats - Get agent chat history
app.get('/api/deals/:id/chats', async (req, res) => {
  try {
    const db = await getDb();
    const chats = await db.all(
      'SELECT * FROM agent_chats WHERE deal_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// POST /api/agent/chat - Send query to Deal Intelligence Agent
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { dealId, message } = req.body;
    if (!dealId || !message) {
      return res.status(400).json({ error: 'dealId and message are required' });
    }

    const db = await getDb();
    const deal = await db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Clean DB duplicates first
    await cleanupDuplicateInteractions(db, dealId);

    const rawInteractions = await db.all(
      'SELECT * FROM interactions WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    // Deduplicate interactions
    const interactions = dedupeInteractionsList(rawInteractions);

    const rawMemories = await db.all(
      'SELECT * FROM memories WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    // Deduplicate memories
    const seenMem = new Set();
    const memories = [];
    for (const mem of rawMemories) {
      if (mem.category === 'stakeholder' && isInvalidName(mem.value)) {
        continue;
      }
      const key = `${mem.category}|${mem.value.trim().toLowerCase()}`;
      if (!seenMem.has(key)) {
        seenMem.add(key);
        memories.push(mem);
      }
    }

    const chatHistory = await db.all(
      'SELECT * FROM agent_chats WHERE deal_id = ? ORDER BY id ASC',
      [dealId]
    );

    // Save User Message
    await db.run(
      'INSERT INTO agent_chats (deal_id, sender, message) VALUES (?, ?, ?)',
      [dealId, 'user', message]
    );

    // Generate response using Gemini AI + persistent hindsight memory context
    const aiResponse = await generateDealAgentResponse(deal, interactions, memories, chatHistory, message);

    // Save Agent Response
    await db.run(
      'INSERT INTO agent_chats (deal_id, sender, message) VALUES (?, ?, ?)',
      [dealId, 'agent', aiResponse]
    );

    res.json({
      sender: 'agent',
      message: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in agent chat endpoint:', error);
    res.status(500).json({ error: 'Failed to generate agent response' });
  }
});

// POST /api/seed - Reset / Seed demo scenario
app.post('/api/seed', async (req, res) => {
  try {
    const db = await getDb();
    await seedDemoData(db);
    res.json({ message: 'Demo scenario seeded successfully' });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

app.listen(PORT, () => {
  console.log(`Deal Intelligence Agent Server running on http://localhost:${PORT}`);
});
