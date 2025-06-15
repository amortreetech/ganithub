const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
});

