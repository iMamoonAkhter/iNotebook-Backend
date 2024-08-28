const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

router.post('/spellcheck', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await axios.post('https://api.languagetool.org/v2/check', null, {
      params: {
        text,
        language: 'en-US'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const { matches } = response.data;
    const misspelledWords = matches.map(match => ({
      word: text.substring(match.offset, match.offset + match.length),
      start: match.offset,
      end: match.offset + match.length
    }));
    
    res.status(200).json({ misspelledWords });
  } catch (error) {
    console.error('Error fetching spell check suggestions:', error);
    res.status(500).json({ error: 'Failed to check spelling' });
  }
});

module.exports = router;
