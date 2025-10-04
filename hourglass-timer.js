#!/usr/bin/env node

/**
 * Hourglass Timer - Detects conversation chunks between user inputs
 * 
 * Usage:
 * 1. Start: node hourglass-timer.js 
 * 2. When you send input to AI: echo "USER_INPUT" >> .conversation-events
 * 3. System detects and measures conversation chunks
 */

const fs = require('fs');
const path = require('path');

console.log('⏳ Hourglass Timer Started');
console.log('📝 Listening for user input events...');
console.log('🎯 Trigger: echo "USER_INPUT" >> .conversation-events');
console.log('🛑 Press Ctrl+C to stop\n');

const eventsFile = '.conversation-events';
const logFile = '.hourglass-log.json';

// Initialize files
if (!fs.existsSync(eventsFile)) {
  fs.writeFileSync(eventsFile, '');
}

let currentSession = {
  startTime: new Date().toISOString(),
  chunks: [],
  currentChunk: {
    startTime: new Date().toISOString(),
    events: [],
    tokenCount: 0
  }
};

// Load existing log
if (fs.existsSync(logFile)) {
  try {
    currentSession = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    console.log('📖 Resumed existing session');
  } catch (error) {
    console.log('🆕 Starting new session');
  }
}

// Watch for events
let lastPosition = fs.statSync(eventsFile).size;

setInterval(() => {
  const currentSize = fs.statSync(eventsFile).size;
  
  if (currentSize > lastPosition) {
    // New content added
    const content = fs.readFileSync(eventsFile, 'utf8');
    const newContent = content.slice(lastPosition);
    lastPosition = currentSize;
    
    // Process new events
    const lines = newContent.trim().split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.trim() === 'USER_INPUT') {
        processUserInput();
      }
    });
  }
}, 100); // Check every 100ms

function processUserInput() {
  const now = new Date().toISOString();
  
  // If this is not the first input, finish current chunk
  if (currentSession.currentChunk.events.length > 0) {
    finishCurrentChunk();
  }
  
  // Start new chunk
  currentSession.currentChunk = {
    startTime: now,
    events: [],
    tokenCount: 0
  };
  
  console.log(`🕐 Hourglass flipped at ${now.split('T')[1].split('.')[0]}`);
  
  // Add the user input event
  currentSession.currentChunk.events.push({
    type: 'user_input',
    timestamp: now,
    content: '[USER INPUT DETECTED]'
  });
  
  saveSession();
}

function finishCurrentChunk() {
  const endTime = new Date().toISOString();
  const startTime = new Date(currentSession.currentChunk.startTime);
  const duration = (new Date(endTime) - startTime) / 1000; // seconds
  
  // Estimate tokens based on duration and typical conversation
  // This is a rough estimate - in real implementation we'd capture actual content
  const estimatedTokens = Math.round(duration * 2); // ~2 tokens per second of conversation
  
  const finishedChunk = {
    ...currentSession.currentChunk,
    endTime,
    duration,
    tokenCount: estimatedTokens,
    chunkNumber: currentSession.chunks.length + 1
  };
  
  currentSession.chunks.push(finishedChunk);
  
  console.log(`📊 Chunk ${finishedChunk.chunkNumber} completed:`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Estimated tokens: ${estimatedTokens}`);
  console.log(`   Total chunks: ${currentSession.chunks.length}`);
  
  // Trigger context dump (simulation)
  console.log(`💾 Context dump triggered for chunk ${finishedChunk.chunkNumber}`);
  
  saveSession();
}

function saveSession() {
  fs.writeFileSync(logFile, JSON.stringify(currentSession, null, 2));
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (currentSession.currentChunk.events.length > 0) {
    console.log('\n⏳ Finishing current chunk before exit...');
    finishCurrentChunk();
  }
  
  console.log('\n📊 Session Summary:');
  console.log(`   Total chunks: ${currentSession.chunks.length}`);
  const totalTokens = currentSession.chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
  console.log(`   Total estimated tokens: ${totalTokens}`);
  console.log(`   Average tokens per chunk: ${Math.round(totalTokens / Math.max(currentSession.chunks.length, 1))}`);
  
  console.log('\n👋 Hourglass timer stopped');
  process.exit(0);
});

console.log('⏳ Hourglass ready - waiting for first user input event...');