const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'JFLIX Proxy is running!', version: '1.0' });
});

app.get('/stream/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const url = `https://torrentio.strem.fun/stream/${type}/${id}.json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JFLIX-Proxy/1.0' }
    });
    if (!response.ok) throw new Error(`Torrentio API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streams', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 JFLIX Proxy running on port ${PORT}`);
});
