const express = require('express');
const path = require('path');

async function startServer() {
    // Dynamic import for 'open' since it is an ES module
    const open = (await import('open')).default;
    
    const app = express();
    const PORT = 3000;

    // Serve all static files from the public directory
    app.use(express.static(path.join(__dirname, 'public')));

    app.listen(PORT, async () => {
        console.log(`✦ Astral Dust running at http://localhost:${PORT}`);
        try {
            await open(`http://localhost:${PORT}`);
            console.log('Opened browser tab automatically.');
        } catch (err) {
            console.error('Failed to open browser:', err);
        }
    });
}

startServer();
