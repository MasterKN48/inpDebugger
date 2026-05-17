/**
 * INP Debugger - Storage Package (Persistence & Analytics)
 * Powered by bun:sqlite
 */

import { Database } from 'bun:sqlite';

let dbInstance = null;

/**
 * Initializes the SQLite database and runs migrations (creates schema if absent)
 * @param {string} dbPath - File path to the SQLite DB
 * @returns {Database} The active Database instance
 */
export function initDb(dbPath = 'inpdebugger.db') {
  if (dbInstance) return dbInstance;

  console.log(`📂 Opening SQLite database at: ${dbPath}`);
  const db = new Database(dbPath);
  
  // Enable foreign key support
  db.query('PRAGMA foreign_keys = ON;').run();
  
  // Create runs table
  db.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      profile TEXT NOT NULL,
      overall_inp INTEGER NOT NULL,
      score TEXT NOT NULL,
      worst_interaction_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Create interactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      type TEXT NOT NULL,
      selector TEXT NOT NULL,
      input_delay INTEGER NOT NULL,
      processing_duration INTEGER NOT NULL,
      presentation_delay INTEGER NOT NULL,
      total INTEGER NOT NULL,
      load_state TEXT NOT NULL,
      target_text TEXT NOT NULL,
      target_html_snippet TEXT NOT NULL,
      timestamp REAL NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    )
  `);

  // Create long_tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS long_tasks (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      interaction_id TEXT,
      start_time REAL NOT NULL,
      duration INTEGER NOT NULL,
      name TEXT NOT NULL,
      attribution TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
      FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for fast querying and analytics
  db.run('CREATE INDEX IF NOT EXISTS idx_runs_url ON runs(url)');
  db.run('CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_interactions_run ON interactions(run_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_long_tasks_run ON long_tasks(run_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_long_tasks_interaction ON long_tasks(interaction_id)');

  dbInstance = db;
  return db;
}

/**
 * Closes the active database connection
 */
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Saves a complete INP analysis run inside an atomic transaction
 * @param {Object} runResult - Output from the measurement engine
 * @returns {string} The run ID
 */
export function saveRunResult(runResult) {
  const db = dbInstance || initDb();
  const runId = runResult.id || 'run_' + Math.random().toString(36).substring(2, 9);
  
  // Format dates / ensure correct structure with strict fallback guards
  const runData = {
    id: runId || '',
    url: runResult.url || '',
    profile: runResult.profile || 'desktop',
    overallINP: runResult.overallINP !== undefined && runResult.overallINP !== null ? runResult.overallINP : 0,
    score: runResult.score || 'good',
    worstInteractionId: runResult.worstInteraction?.id || null,
    createdAt: runResult.createdAt || new Date().toISOString()
  };

  // Assign IDs to interactions if missing, with full fallback values
  const interactions = (runResult.interactions || []).map(int => ({
    id: int.id || 'int_' + Math.random().toString(36).substring(2, 9),
    type: int.type || 'click',
    selector: int.selector || '',
    inputDelay: int.inputDelay !== undefined && int.inputDelay !== null ? int.inputDelay : 0,
    processingDuration: int.processingDuration !== undefined && int.processingDuration !== null ? int.processingDuration : 0,
    presentationDelay: int.presentationDelay !== undefined && int.presentationDelay !== null ? int.presentationDelay : 0,
    total: int.total !== undefined && int.total !== null ? int.total : 0,
    loadState: int.loadState || 'complete',
    targetText: int.targetText || '',
    targetHtmlSnippet: int.targetHtmlSnippet || '',
    timestamp: int.timestamp !== undefined && int.timestamp !== null ? int.timestamp : 0
  }));

  // Identify if worstInteraction's temporary ID needs matching
  if (runResult.worstInteraction) {
    const matchedWorst = interactions.find(
      i => i.selector === runResult.worstInteraction.selector && i.total === runResult.worstInteraction.total
    );
    if (matchedWorst) {
      runData.worstInteractionId = matchedWorst.id;
    }
  }

  // Compile prepared statements OUTSIDE the transaction block to prevent Bun query-cache native panics/double-free SIGTRAP
  const insertRunStmt = db.prepare(`
    INSERT INTO runs (id, url, profile, overall_inp, score, worst_interaction_id, created_at)
    VALUES ($id, $url, $profile, $overall_inp, $score, $worst_interaction_id, $created_at)
  `);

  const insertIntStmt = db.prepare(`
    INSERT INTO interactions (id, run_id, type, selector, input_delay, processing_duration, presentation_delay, total, load_state, target_text, target_html_snippet, timestamp)
    VALUES ($id, $run_id, $type, $selector, $input_delay, $processing_duration, $presentation_delay, $total, $load_state, $target_text, $target_html_snippet, $timestamp)
  `);

  const insertLtStmt = db.prepare(`
    INSERT INTO long_tasks (id, run_id, interaction_id, start_time, duration, name, attribution)
    VALUES ($id, $run_id, $interaction_id, $start_time, $duration, $name, $attribution)
  `);

  // Execute manual transaction with rollback safety
  db.run("BEGIN TRANSACTION");
  try {
    // 1. Insert Run
    insertRunStmt.run({
      $id: runData.id || '',
      $url: runData.url || '',
      $profile: runData.profile || 'desktop',
      $overall_inp: runData.overallINP !== undefined && runData.overallINP !== null ? runData.overallINP : 0,
      $score: runData.score || 'good',
      $worst_interaction_id: runData.worstInteractionId || null,
      $created_at: runData.createdAt || new Date().toISOString()
    });

    // 2. Insert Interactions
    for (const int of interactions) {
      insertIntStmt.run({
        $id: int.id || '',
        $run_id: runData.id || '',
        $type: int.type || 'click',
        $selector: int.selector || '',
        $input_delay: int.inputDelay !== undefined && int.inputDelay !== null ? int.inputDelay : 0,
        $processing_duration: int.processingDuration !== undefined && int.processingDuration !== null ? int.processingDuration : 0,
        $presentation_delay: int.presentationDelay !== undefined && int.presentationDelay !== null ? int.presentationDelay : 0,
        $total: int.total !== undefined && int.total !== null ? int.total : 0,
        $load_state: int.loadState || 'complete',
        $target_text: int.targetText || '',
        $target_html_snippet: int.targetHtmlSnippet || '',
        $timestamp: int.timestamp !== undefined && int.timestamp !== null ? int.timestamp : 0
      });
    }

    // 3. Insert Long Tasks & map their correlations
    const insertedLts = new Set();
    const lts = runResult.longTasks || [];

    for (const lt of lts) {
      // Find if this long task falls within any interaction timeframe
      let correlatedId = null;
      for (const int of interactions) {
        const intStart = int.timestamp;
        const intEnd = intStart + int.total;
        const ltStart = lt.startTime;
        const ltEnd = ltStart + lt.duration;

        const overlaps = (ltStart >= intStart && ltStart <= intEnd) ||
                         (ltEnd >= intStart && ltEnd <= intEnd) ||
                         (ltStart <= intStart && ltEnd >= intEnd);

        if (overlaps) {
          correlatedId = int.id;
          break;
        }
      }

      const ltKey = `${lt.startTime}_${lt.duration}`;
      if (!insertedLts.has(ltKey)) {
        insertedLts.add(ltKey);
        insertLtStmt.run({
          $id: 'lt_' + Math.random().toString(36).substring(2, 9),
          $run_id: runData.id || '',
          $interaction_id: correlatedId || null,
          $start_time: lt.startTime !== undefined && lt.startTime !== null ? lt.startTime : 0,
          $duration: lt.duration !== undefined && lt.duration !== null ? lt.duration : 0,
          $name: lt.name || 'script',
          $attribution: typeof lt.attribution === 'string' ? lt.attribution : JSON.stringify(lt.attribution || {})
        });
      }
    }

    db.run("COMMIT");
  } catch (err) {
    db.run("ROLLBACK");
    throw err;
  }

  return runId;
}

/**
 * Retrieves a single complete run result with all nested children
 * @param {string} runId - The ID of the run
 * @returns {Object|null} Complete hydrated run, or null
 */
export function getRunResult(runId) {
  const db = dbInstance || initDb();
  
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
  if (!run) return null;

  const interactions = db.prepare('SELECT * FROM interactions WHERE run_id = ?').all(runId);
  const longTasks = db.prepare('SELECT * FROM long_tasks WHERE run_id = ?').all(runId);

  // Map and hydrate interactions
  const hydratedInts = interactions.map(int => {
    // Parse snake_case SQL back to camelCase JSON
    const parsed = {
      id: int.id,
      type: int.type,
      selector: int.selector,
      inputDelay: int.input_delay,
      processingDuration: int.processing_duration,
      presentationDelay: int.presentation_delay,
      total: int.total,
      loadState: int.load_state,
      targetText: int.target_text,
      targetHtmlSnippet: int.target_html_snippet,
      timestamp: int.timestamp,
      longTasks: []
    };

    // Correlate long tasks
    parsed.longTasks = longTasks
      .filter(lt => lt.interaction_id === int.id)
      .map(lt => ({
        startTime: lt.start_time,
        duration: lt.duration,
        name: lt.name,
        attribution: JSON.parse(lt.attribution)
      }));

    return parsed;
  });

  // Hydrate main long tasks list
  const hydratedLts = longTasks.map(lt => ({
    startTime: lt.start_time,
    duration: lt.duration,
    name: lt.name,
    attribution: JSON.parse(lt.attribution)
  }));

  // Match worst interaction
  const worstInteraction = hydratedInts.find(i => i.id === run.worst_interaction_id) || null;

  return {
    id: run.id,
    url: run.url,
    profile: run.profile,
    overallINP: run.overall_inp,
    score: run.score,
    worstInteraction,
    interactions: hydratedInts.sort((a, b) => b.total - a.total),
    longTasks: hydratedLts,
    createdAt: run.created_at
  };
}

/**
 * Retrieves lists of historical runs
 * @param {Object} options - Filtering and pagination options
 * @returns {Array<Object>} List of runs
 */
export function getHistoryList(options = {}) {
  const db = dbInstance || initDb();
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const url = options.url || null;

  let query = `
    SELECT r.*, 
           (SELECT COUNT(*) FROM interactions WHERE run_id = r.id) as interaction_count,
           (SELECT COUNT(*) FROM long_tasks WHERE run_id = r.id) as long_task_count
    FROM runs r
  `;
  
  const params = [];
  if (url) {
    query += ' WHERE r.url = ?';
    params.push(url);
  }

  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);

  return rows.map(row => ({
    id: row.id,
    url: row.url,
    profile: row.profile,
    overallINP: row.overall_inp,
    score: row.score,
    interactionCount: row.interaction_count,
    longTaskCount: row.long_task_count,
    createdAt: row.created_at
  }));
}

/**
 * Deletes a run and cascades to all child interactions/long tasks
 * @param {string} runId 
 * @returns {boolean} Success state
 */
export function deleteRun(runId) {
  const db = dbInstance || initDb();
  const res = db.prepare('DELETE FROM runs WHERE id = ?').run(runId);
  return res.changes > 0;
}

/**
 * Performs aggregate diagnostics for a given URL
 * @param {string} url - Target URL
 * @returns {Object} Analytical trends and element bottlenecks
 */
export function getAnalyticsOverview(url) {
  const db = dbInstance || initDb();
  
  // Aggregate averages and counts
  const summary = db.prepare(`
    SELECT COUNT(*) as total_runs,
           AVG(overall_inp) as avg_inp,
           COUNT(CASE WHEN score = 'good' THEN 1 END) as good_count,
           COUNT(CASE WHEN score = 'needs-improvement' THEN 1 END) as needs_improvement_count,
           COUNT(CASE WHEN score = 'poor' THEN 1 END) as poor_count
    FROM runs
    WHERE url = ?
  `).get(url);

  if (!summary || summary.total_runs === 0) {
    return { totalRuns: 0, message: 'No historical runs found for this URL.' };
  }

  // Find most frequent slow interactive elements (Bottlenecks)
  const bottlenecks = db.prepare(`
    SELECT selector, 
           type,
           COUNT(*) as occurrences,
           AVG(total) as avg_latency,
           AVG(input_delay) as avg_input_delay,
           AVG(processing_duration) as avg_processing_duration,
           AVG(presentation_delay) as avg_presentation_delay
    FROM interactions i
    JOIN runs r ON i.run_id = r.id
    WHERE r.url = ? AND i.total > 150
    GROUP BY selector, type
    ORDER BY occurrences DESC, avg_latency DESC
    LIMIT 5
  `).all(url);

  return {
    url,
    totalRuns: summary.total_runs,
    averageINP: Math.round(summary.avg_inp),
    distribution: {
      good: summary.good_count,
      needsImprovement: summary.needs_improvement_count,
      poor: summary.poor_count
    },
    bottlenecks: bottlenecks.map(b => ({
      selector: b.selector,
      type: b.type,
      occurrences: b.occurrences,
      averageLatency: Math.round(b.avg_latency),
      breakdown: {
        inputDelay: Math.round(b.avg_input_delay),
        processingDuration: Math.round(b.avg_processing_duration),
        presentationDelay: Math.round(b.avg_presentation_delay)
      }
    }))
  };
}
