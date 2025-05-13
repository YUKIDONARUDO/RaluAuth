require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

app.get('/', (req, res) => {
  res.send('<a href="/login">Discordでログイン</a>');
});

app.get('/login', (req, res) => {
  const oauthURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read`;
  res.redirect(oauthURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const memberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const roles = memberResponse.data.roles;

    if (roles.includes(REQUIRED_ROLE_ID)) {
      res.send(`<h2>ようこそ、${userResponse.data.username} さん！アクセス許可されました。</h2>`);
    } else {
      res.send('<h2>アクセスできません。このページは特定ロールを持つメンバー限定です。</h2>');
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('<h2>認証に失敗しました。</h2>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
