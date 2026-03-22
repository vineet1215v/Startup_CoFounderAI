const { pgTable, text, timestamp, integer, real, jsonb, uuid } = require('drizzle-orm/pg-core')

const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull(),
  founderContext: text('founder_context'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  eventId: text('event_id'),
  role: text('role'),
  agentName: text('agent_name'),
  messageType: text('message_type'),
  content: text('content').notNull(),
  confidence: real('confidence').default(0),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const decisions = pgTable('decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  summary: text('summary').notNull(),
  confidence: real('confidence').default(0),
  consensus: jsonb('consensus_json').default({}),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const executionTasks = pgTable('execution_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  title: text('title').notNull(),
  ownerRole: text('owner_role'),
  status: text('status').notNull(),
  progress: integer('progress').default(0),
  blocker: text('blocker'),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const agentMemory = pgTable('agent_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  agentRole: text('agent_role').notNull(),
  memoryType: text('memory_type').notNull(),
  content: text('content').notNull(),
  embedding: jsonb('embedding_json').default([]),
  weight: real('weight').default(0),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const analytics = pgTable('analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id'),
  metricKey: text('metric_key').notNull(),
  metricValue: real('metric_value').default(0),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const founderProfiles = pgTable('founder_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  founderId: text('founder_id').notNull().unique(),
  riskTolerance: real('risk_tolerance').default(0.5),
  decisionStyle: text('decision_style').default('balanced'),
  preferences: jsonb('preferences_json').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id'),
  level: text('level').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const artifacts = pgTable('artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  artifactType: text('artifact_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

module.exports = {
  sessions,
  conversations,
  decisions,
  executionTasks,
  agentMemory,
  analytics,
  founderProfiles,
  notifications,
  artifacts,
}
