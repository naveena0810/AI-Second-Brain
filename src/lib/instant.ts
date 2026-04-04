import { init } from "@instantdb/react";

// The Instant App ID should be safely configured.
// Replace this with your actual app ID from InstantDB dashboard.
// Default fallback added to ensure app runs if env is missing during design phase.
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "PASTE_YOUR_APP_ID_HERE";

interface Query {
  id: string;
  question: string;
  answer: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  deepDive?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  keyPoints?: string[];
  concepts?: string[];
  userId: string;
  createdAt: number;
}

interface Connection {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  relation: string;
  userId: string;
  createdAt: number;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  fileUrl: string;
  textContent: string;
  userId: string;
  createdAt: number;
}

interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkText: string;
  embedding: number[];
  createdAt: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

interface TimelineEvent {
  id: string;
  type: "document" | "note" | "query";
  title: string;
  description: string;
  referenceId: string;
  userId: string;
  date: number;
  createdAt: number;
}

interface Source {
  id: string;
  queryId: string;
  documentId: string;
  chunkText: string;
  pageNumber?: number;
  createdAt: number;
}

interface Summary {
  id: string;
  referenceId: string; // documentId or noteId
  summary: string;
  keyPoints: string[];
  concepts: string[];
  length: 'short' | 'medium' | 'detailed';
  userId: string;
  createdAt: number;
}

interface KnowledgeInsight {
  id: string;
  userId: string;
  knownTopics: string[];
  missingTopics: string[];
  suggestions: string[];
  createdAt: number;
}

interface ConceptMap {
  id: string;
  userId: string;
  sourceId: string; // ID of the note/doc/query
  sourceType: 'note' | 'document' | 'query';
  nodes: string; // JSON string of nodes
  edges: string; // JSON string of edges
  createdAt: number;
}

interface UserActivity {
  id: string;
  userId: string;
  topic: string;
  lastAccessed: number;
  interactionCount: number;
  type: "query" | "document" | "note";
  createdAt: number;
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "missed_topic" | "revision" | "suggestion" | "streak" | "motivation";
  isRead: boolean;
  actionLink?: string;
  priority: "high" | "medium" | "low";
  createdAt: number;
}

type Schema = {
  queries: Query;
  notes: Note;
  connections: Connection;
  knowledgeDocuments: KnowledgeDocument;
  knowledgeChunks: KnowledgeChunk;
  userProfiles: UserProfile;
  timelineEvents: TimelineEvent;
  querySources: Source;
  summaries: Summary;
  knowledgeInsights: KnowledgeInsight;
  conceptMaps: ConceptMap;
  userActivity: UserActivity;
  notifications: Notification;
};

export const db = init({ appId: APP_ID, devtool: false });
