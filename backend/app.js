// ============================================
// Bet Analyzer - Backend (Node.js + Express)
// ============================================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'TON_TOKEN_DISCORD';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || 'ID_DU_SALON_DISCORD';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || 'TON_API_KEY_FOOTBALL';
const TENNIS_API_KEY = process.env.TENNIS_API_KEY || 'TON_API_KEY_TENNIS';

// Middleware
app.use(cors());
app.use(express.json());

// Client Discord
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
if (DISCORD_TOKEN !== 'TON_TOKEN_DISCORD') {
  discordClient.login(DISCORD_TOKEN).catch(err => console.error('❌ Discord error:', err));
}

async function sendDiscordNotification(message) {
  if (DISCORD_TOKEN === 'TON_TOKEN_DISCORD' || !discordClient.isReady()) {
    console.log('⚠️ Discord non configuré. Message:', message);
    return;
  }
  try {
    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (channel?.isTextBased()) await channel.send(message);
  } catch (err) { console.error('❌ Erreur Discord:', err); }
}

// Récupérer les matchs de foot
async function fetchFootballMatches(league, date) {
  try {
    const url = `https://v3.football.api-sports.io/fixtures?league=${league}&season=2026&from=${date}&to=${date}`;
    const response = await axios.get(url, { headers: { 'x-apisports-key': API_FOOTBALL_KEY } });
    return response.data.response || [];
  } catch (err) { console.error('❌ Erreur API Football:', err.message); return []; }
}

// Générer 5 pronostics
function generatePredictions(match) {
  const sport = match.sport || (match.teams ? 'football' : 'tennis');
  return [
    { type: '1', description: `Victoire de ${match.teams?.home?.name || match.player1?.name || 'Équipe 1'}`, probability: (Math.random() * 100).toFixed(1), odds: (1 + Math.random() * 4).toFixed(2) },
    { type: sport === 'football' ? 'X' : '2', description: sport === 'football' ? 'Match nul' : `Victoire de ${match.teams?.away?.name || match.player2?.name || 'Joueur 2'}`, probability: (Math.random() * 100).toFixed(1), odds: (1 + Math.random() * 4).toFixed(2) },
    { type: 'over_2_5', description: sport === 'football' ? 'Plus de 2.5 buts' : 'Match en tie-break', probability: (Math.random() * 100).toFixed(1), odds: (1 + Math.random() * 4).toFixed(2) },
    { type: 'early_event', description: sport === 'football' ? 'But dans les 10 premières minutes' : 'Premier set gagné', probability: (Math.random() * 100).toFixed(1), odds: (1 + Math.random() * 4).toFixed(2) },
    { type: 'special_event', description: sport === 'football' ? 'Un carton sera donné' : 'Double faute', probability: (Math.random() * 100).toFixed(1), odds: (1 + Math.random() * 4).toFixed(2) }
  ];
}

// Routes API
app.get('/api/matches/football', async (req, res) => {
  try {
    const { league, date } = req.query;
    const matches = await fetchFootballMatches(league, date || '2026-08-19');
    const matchesWithPredictions = matches.map(match => ({
      ...match,
      sport: 'football',
      predictions: generatePredictions({ ...match, sport: 'football' })
    }));
    res.json({ success: true, data: matchesWithPredictions });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/matches/tennis', async (req, res) => {
  try {
    const { tournament, date } = req.query;
    const matches = []; // À implémenter avec Tennis API
    const matchesWithPredictions = matches.map(match => ({
      ...match,
      sport: 'tennis',
      predictions: generatePredictions({ ...match, sport: 'tennis' })
    }));
    res.json({ success: true, data: matchesWithPredictions });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/matches/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, error: 'Query requis' });
    const footballMatches = await fetchFootballMatches();
    const filteredMatches = footballMatches.filter(match =>
      match.teams?.home?.name.toLowerCase().includes(query.toLowerCase()) ||
      match.teams?.away?.name.toLowerCase().includes(query.toLowerCase())
    );
    const resultsWithPredictions = filteredMatches.map(match => ({
      ...match,
      sport: 'football',
      predictions: generatePredictions({ ...match, sport: 'football' })
    }));
    res.json({ success: true, data: resultsWithPredictions });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/matches/:id/live-update', async (req, res) => {
  try {
    const { id } = req.params;
    const { sport, liveData } = req.body;
    const match = await fetchFootballMatches(id); // Simplifié
    const updatedPredictions = generatePredictions({ ...match, sport });
    const notification = `🔄 **Mise à jour live** : ${liveData.event || 'Événement'}\\n${updatedPredictions.map(p => `• ${p.description} (Cote: ${p.odds})`).join('\\n')}`;
    await sendDiscordNotification(notification);
    res.json({ success: true, data: { match, predictions: updatedPredictions } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Démarrage
app.listen(PORT, () => console.log(`✅ Serveur démarré sur http://localhost:${PORT}`));
module.exports = app;
