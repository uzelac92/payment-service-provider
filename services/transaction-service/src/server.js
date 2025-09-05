require('dotenv').config();
const app = require('./app');

const PORT = Number(process.env.PORT) || 4004;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

