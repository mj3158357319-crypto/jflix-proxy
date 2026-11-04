const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'JFLIX Proxy v2 is running!', 
    version: '2.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      torrentio: '/stream/:type/:id',
      knightcrawler: '/knight/:type/:id',
      mediafusion: '/mediafusion/:type/:id'
    }
  });
});

// Torrentio proxy - MAIN ENDPOINT
app.get('/stream/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    console.log(`📡 Fetching from Torrentio: ${type}/${id}`);
    
    // Torrentio ka actual endpoint
    const torrentioUrl = `https://torrentio.strem.fun/stream/${type}/${id}.json`;
    
    const response = await fetch(torrentioUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`Torrentio returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Torrentio response: ${data.streams?.length || 0} streams`);
    
    // Add metadata to response
    data._proxy = {
      source: 'torrentio',
      fetchedAt: new Date().toISOString(),
      totalStreams: data.streams?.length || 0,
      httpStreams: data.streams?.filter(s => s.url && s.url.startsWith('http')).length || 0,
      magnetStreams: data.streams?.filter(s => s.url && (s.url.startsWith('magnet:') || s.infoHash)).length || 0
    };
    
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch streams', 
      message: error.message,
      streams: [],
      _proxy: { error: true }
    });
  }
});

// Knight Crawler proxy
app.get('/knight/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const url = `https://knightcrawler.elfhosted.com/stream/${type}/${id}.json`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message, streams: [] });
  }
});

// MediaFusion proxy
app.get('/mediafusion/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const url = `https://mediafusion.elfhosted.com/stream/${type}/${id}.json`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message, streams: [] });
  }
});

// Test endpoint - check if Torrentio is reachable
app.get('/test/torrentio', async (req, res) => {
  try {
    const response = await fetch('https://torrentio.strem.fun/manifest.json');
    const data = await response.json();
    res.json({ 
      status: 'Torrentio is reachable',
      addon: data.name,
      version: data.version
    });
  } catch (error) {
    res.status(500).json({ error: 'Torrentio not reachable', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 JFLIX Proxy v2 running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - /stream/:type/:id (Torrentio)`);
  console.log(`   - /knight/:type/:id (Knight Crawler)`);
  console.log(`   - /mediafusion/:type/:id (MediaFusion)`);
  console.log(`   - /test/torrentio (Health check)`);
});
