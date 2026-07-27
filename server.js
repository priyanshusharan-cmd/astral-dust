const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve all static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`✦ Astral Dust running at http://localhost:${PORT}`);
});
