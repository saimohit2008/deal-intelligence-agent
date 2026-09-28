import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, 'deals.db');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');

  // Initialize Tables
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      value INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'Discovery',
      health TEXT DEFAULT 'Medium',
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date_str TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      interaction_id INTEGER,
      category TEXT NOT NULL, -- 'stakeholder', 'objection', 'competitor', 'concern', 'commitment', 'outcome'
      value TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
      FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      sender TEXT NOT NULL, -- 'user' or 'agent'
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );
  `);

  // Check if we need to seed the demo Acme Corp deal
  const existingCount = await dbInstance.get('SELECT COUNT(*) as count FROM deals');
  if (existingCount.count === 0) {
    await seedDemoData(dbInstance);
  }

  return dbInstance;
}

export async function seedDemoData(db) {
  // Clear existing if resetting
  await db.exec(`DELETE FROM agent_chats`);
  await db.exec(`DELETE FROM memories`);
  await db.exec(`DELETE FROM interactions`);
  await db.exec(`DELETE FROM deals`);

  // Insert Acme Corp deal
  const dealResult = await db.run(`
    INSERT INTO deals (name, company, value, stage, health, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'Acme Corp Enterprise Expansion',
    'Acme Corp',
    180000,
    'Evaluation',
    'At Risk',
    'Acme Corp is evaluating our platform for enterprise workflow automation. CTO David raised security concerns and team highlighted pricing objections.'
  ]);

  const dealId = dealResult.lastID;

  // Insert 6 interactions for Acme Corp as defined in Core Demo Scenario
  const demoInteractions = [
    {
      title: 'Interaction 1: Initial Discovery',
      date_str: 'Day 1',
      content: 'Acme Corp is interested in our enterprise automation platform. Met with procurement and initial tech team. High interest in capabilities.',
      memories: [
        { category: 'outcome', value: 'Platform interest confirmed', details: 'Initial discovery call went well' },
        { category: 'stakeholder', value: 'Procurement & Tech Lead', details: 'Initial contacts' }
      ]
    },
    {
      title: 'Interaction 2: Pricing Discussion',
      date_str: 'Day 4',
      content: 'Acme team expressed concerns that our pricing structure is too high compared to their initial budget expectations for this fiscal year.',
      memories: [
        { category: 'objection', value: 'Pricing too high', details: 'Exceeds initial budget expectations for Q3' }
      ]
    },
    {
      title: 'Interaction 3: Competitor Evaluation',
      date_str: 'Day 8',
      content: 'Acme revealed they are also actively evaluating Competitor X. Competitor X is offering aggressive discount tiers.',
      memories: [
        { category: 'competitor', value: 'Competitor X', details: 'Actively evaluating Competitor X with aggressive pricing' }
      ]
    },
    {
      title: 'Interaction 4: CTO Security Review',
      date_str: 'Day 12',
      content: 'Met with David, Acme\'s CTO. David raised major concerns about SOC2 compliance, data encryption at rest, and security auditing standard capabilities.',
      memories: [
        { category: 'stakeholder', value: 'David', details: 'Chief Technology Officer (CTO) & Key Decision Maker' },
        { category: 'concern', value: 'Security compliance & SOC2', details: 'CTO concerned about data encryption at rest and security standards' }
      ]
    },
    {
      title: 'Interaction 5: Documentation Promise',
      date_str: 'Day 15',
      content: 'The salesperson promised David and the security team that we would send full security compliance documentation, SOC2 Type II report, and data protection whitepaper.',
      memories: [
        { category: 'commitment', value: 'Send security documentation & SOC2 Type II report', details: 'Promised to CTO David' }
      ]
    },
    {
      title: 'Interaction 6: Security Documentation Sent',
      date_str: 'Day 20',
      content: 'Security documentation package was emailed to David. However, David reviewed it and still has follow-up questions regarding single-sign-on (SSO) integration and audit logs.',
      memories: [
        { category: 'outcome', value: 'Security documentation delivered', details: 'Sent SOC2 Type II & whitepaper to David' },
        { category: 'concern', value: 'SSO Integration & Audit Logs', details: 'David has remaining questions on SSO & compliance audit logs' }
      ]
    }
  ];

  for (const inter of demoInteractions) {
    const interRes = await db.run(`
      INSERT INTO interactions (deal_id, title, content, date_str)
      VALUES (?, ?, ?, ?)
    `, [dealId, inter.title, inter.content, inter.date_str]);
    const interId = interRes.lastID;

    for (const mem of inter.memories) {
      await db.run(`
        INSERT INTO memories (deal_id, interaction_id, category, value, details)
        VALUES (?, ?, ?, ?, ?)
      `, [dealId, interId, mem.category, mem.value, mem.details]);
    }
  }

  // Insert a second sample deal for rich dashboard experience
  const deal2Res = await db.run(`
    INSERT INTO deals (name, company, value, stage, health, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'Starlight Systems Global License',
    'Starlight Systems',
    240000,
    'Negotiation',
    'High',
    'Global expansion project across 3 regions. Primary stakeholder VP Sales Operations.'
  ]);
  const deal2Id = deal2Res.lastID;

  await db.run(`
    INSERT INTO interactions (deal_id, title, content, date_str)
    VALUES (?, ?, ?, ?)
  `, [deal2Id, 'Executive Sponsorship Call', 'Met with VP Sales Operations Sarah Jenkins. Procurement approved legal terms.', 'Day 10']);

  await db.run(`
    INSERT INTO memories (deal_id, interaction_id, category, value, details)
    VALUES (?, ?, ?, ?, ?)
  `, [deal2Id, null, 'stakeholder', 'Sarah Jenkins', 'VP Sales Operations']);

  console.log('Database seeded successfully with Acme Corp core demo scenario and Starlight Systems deal.');
}
