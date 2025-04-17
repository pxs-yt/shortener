const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const app = express();
const db = new sqlite3.Database('./db/database.sqlite');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT UNIQUE,
    target_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER,
    hash TEXT UNIQUE,
    ip TEXT,
    user_agent TEXT,
    server_data TEXT,
    client_data TEXT,
    behavior_data TEXT,
    nuclear_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(link_id) REFERENCES links(id)
  )`);
});

app.use(express.json());
app.use(express.static('public'));

// Generate short code
const generateCode = () => crypto.randomBytes(4).toString('hex');

// Create or retrieve short URL
app.post('/api/create', async (req, res) => {
  try {
    const { url, customCode } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Check for existing URL
    const existing = await new Promise(resolve => {
      db.get('SELECT short_code FROM links WHERE target_url = ?', [url], (err, row) => {
        resolve(row);
      });
    });

    if (existing) return res.json({ code: existing.short_code, existing: true });

    // Validate custom code
    let code = customCode || generateCode();
    if (customCode) {
      const exists = await new Promise(resolve => {
        db.get('SELECT 1 FROM links WHERE short_code = ?', [customCode], (err, row) => {
          resolve(!!row);
        });
      });

      if (exists) return res.status(400).json({ error: 'Custom code already in use' });
      if (!/^[a-z0-9_-]{3,20}$/i.test(customCode)) {
        return res.status(400).json({ error: 'Invalid custom code format' });
      }
    }

    // Insert new record
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO links (short_code, target_url) VALUES (?, ?)',
        [code, url],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    res.json({ code });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect endpoint with tracking
app.get('/:code', (req, res) => {
  const startTime = Date.now();
  
  db.get(
    'SELECT id, target_url FROM links WHERE short_code = ?',
    [req.params.code],
    (err, link) => {
      if (err || !link) return res.status(404).send('Link not found');

      // Server-side data
      const serverData = {
        ip: req.ip,
        headers: req.headers,
        dns: req.hostname,
        tcp: {
          ttl: req.socket._handle?.ttl,
          timing: Date.now() - startTime
        },
        geo: req.headers['cf-ipcountry'] || null
      };

      db.run(
        `INSERT INTO fingerprints 
        (link_id, ip, user_agent, server_data)
        VALUES (?, ?, ?, ?)`,
        [link.id, req.ip, req.headers['user-agent'], JSON.stringify(serverData)],
        function(err) {
          if (err) return res.redirect(link.target_url);
          
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Redirecting...</title>
                <script>
                  window.TRACKING_ID = ${this.lastID};
                  window.TARGET_URL = ${JSON.stringify(link.target_url)};
                </script>
                <script src="/js/tracking.js"></script>
              </head>
              <body>
                <noscript>
                  <meta http-equiv="refresh" content="0;url=${link.target_url}">
                </noscript>
              </body>
            </html>
          `);
        }
      );
    }
  );
});

// Tracking data endpoint
app.post('/api/track', express.json(), async (req, res) => {
  try {
    const { id, clientData, behavior } = req.body;
    
    // Generate composite hash
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({ clientData, behavior }))
      .digest('hex');

    // Update all data columns
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE fingerprints SET 
        client_data = ?,
        behavior_data = ?,
        nuclear_data = ?,
        hash = ?
        WHERE id = ?`,
        [
          JSON.stringify(clientData),
          JSON.stringify(behavior),
          JSON.stringify({ clientData, behavior }), // Combined nuclear data
          hash,
          id
        ],
        function(err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Tracking save error:', err);
    res.status(500).send();
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});