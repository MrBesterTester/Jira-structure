/**
 * Jira Structure Learning Tool - Express Server
 * 
 * Minimal Express server that:
 * - Serves static files from the React build directory
 * - Provides REST API endpoints for JSON file operations
 * - Stores data in /data directory at project root
 * - Auto-opens browser in production mode
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Determine if we're in production mode (running from compiled JS)
const isProduction = !import.meta.url.endsWith('.ts');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Data directory path (relative to project root)
// In development: src/server -> ../../data
// In production: dist-server/server -> ../../data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Dist directory for serving built React app
const DIST_DIR = path.join(__dirname, '../../dist');

// Valid data file names
const VALID_FILES = ['projects', 'issues', 'sprints', 'users', 'structures'] as const;
type DataFileName = typeof VALID_FILES[number];

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for development (allow all localhost ports)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure the data directory exists and create initial empty JSON files if needed
 */
function initializeDataDirectory(): void {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
  }

  // Create initial empty JSON files if they don't exist
  for (const fileName of VALID_FILES) {
    const filePath = path.join(DATA_DIR, `${fileName}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      console.log(`Created empty data file: ${filePath}`);
    }
  }
}

/**
 * Read a JSON file from the data directory
 */
function readDataFile(fileName: DataFileName): unknown {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write data to a JSON file in the data directory
 */
function writeDataFile(fileName: DataFileName, data: unknown): void {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Validate that the file name is one of the allowed data files
 */
function isValidFileName(name: string): name is DataFileName {
  return VALID_FILES.includes(name as DataFileName);
}

// ============================================================================
// API ROUTES
// ============================================================================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/:resource - Read a data file
app.get('/api/:resource', (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  
  if (!isValidFileName(resource)) {
    res.status(400).json({
      success: false,
      error: `Invalid resource: ${resource}. Valid resources: ${VALID_FILES.join(', ')}`,
    });
    return;
  }
  
  try {
    const data = readDataFile(resource);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`Error reading ${resource}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to read ${resource}`,
    });
  }
});

// PUT /api/:resource - Write a data file
app.put('/api/:resource', (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  
  if (!isValidFileName(resource)) {
    res.status(400).json({
      success: false,
      error: `Invalid resource: ${resource}. Valid resources: ${VALID_FILES.join(', ')}`,
    });
    return;
  }
  
  try {
    const data = req.body;
    
    // Validate that data is an array (our JSON files store arrays)
    if (!Array.isArray(data)) {
      res.status(400).json({
        success: false,
        error: 'Request body must be an array',
      });
      return;
    }
    
    writeDataFile(resource, data);
    
    res.json({
      success: true,
      data,
      message: `${resource} updated successfully`,
    });
  } catch (error) {
    console.error(`Error writing ${resource}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to write ${resource}`,
    });
  }
});

// ============================================================================
// STATIC FILE SERVING (for production)
// ============================================================================

// In production, serve the built React app
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  
  // Handle client-side routing - serve index.html for all non-API routes
  // Express 5 requires named wildcard parameters
  app.get('/{*splat}', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
} else {
  // Development mode: show a helpful landing page
  app.get('/', (_req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Jira Structure API Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
            h1 { color: #0052CC; }
            .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
            a { color: #0052CC; }
            .endpoint { margin: 8px 0; }
            .method { display: inline-block; width: 50px; font-weight: bold; }
            .get { color: #22863a; }
            .put { color: #b08800; }
          </style>
        </head>
        <body>
          <h1>Jira Structure API Server</h1>
          <div class="card">
            <h2>Status: Running</h2>
            <p>The API server is running on port ${PORT}.</p>
            <p><strong>Frontend:</strong> Run <code>npm run dev</code> to start both the React app (port 5173) and this API server together.</p>
          </div>
          <div class="card">
            <h2>Available Endpoints</h2>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/health">/api/health</a> - Health check</div>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/projects">/api/projects</a> - Get all projects</div>
            <div class="endpoint"><span class="method put">PUT</span> /api/projects - Update projects</div>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/issues">/api/issues</a> - Get all issues</div>
            <div class="endpoint"><span class="method put">PUT</span> /api/issues - Update issues</div>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/sprints">/api/sprints</a> - Get all sprints</div>
            <div class="endpoint"><span class="method put">PUT</span> /api/sprints - Update sprints</div>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/users">/api/users</a> - Get all users</div>
            <div class="endpoint"><span class="method put">PUT</span> /api/users - Update users</div>
            <div class="endpoint"><span class="method get">GET</span> <a href="/api/structures">/api/structures</a> - Get all structures</div>
            <div class="endpoint"><span class="method put">PUT</span> /api/structures - Update structures</div>
          </div>
        </body>
      </html>
    `);
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Open browser (dynamically imported to avoid issues in production)
 */
async function openBrowser(url: string): Promise<void> {
  try {
    // Dynamically import 'open' package
    const open = await import('open');
    await open.default(url);
  } catch {
    // Silently fail if open package is not available
    console.log(`Open your browser to: ${url}`);
  }
}

// Initialize data directory and start server
initializeDataDirectory();

const server = app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  const hasDistFolder = fs.existsSync(DIST_DIR);
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║        Jira Structure Learning Tool - Server               ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: ${url.padEnd(35)}║
║  Mode: ${(isProduction ? 'Production' : 'Development').padEnd(48)}║
║  Data directory: ${DATA_DIR.slice(-40).padEnd(40)}║
╠════════════════════════════════════════════════════════════╣
║  Available endpoints:                                      ║
║    GET  /api/health      - Health check                    ║
║    GET  /api/projects    - Get all projects                ║
║    GET  /api/issues      - Get all issues                  ║
║    GET  /api/sprints     - Get all sprints                 ║
║    GET  /api/users       - Get all users                   ║
║    GET  /api/structures  - Get all structures              ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Auto-open browser in production mode when dist folder exists
  if (isProduction && hasDistFolder) {
    console.log('Opening browser...');
    await openBrowser(url);
  } else if (!hasDistFolder) {
    console.log('Note: Run "npm run build" to create the production app.');
    console.log('      Then run "npm start" to serve it.');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

export default app;
