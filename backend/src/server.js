const express = require('express');
const cors = require('cors');
const testRoutes = require('./routes/testRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Montamos las rutas bajo el prefijo /api
app.use('/api', testRoutes);

app.listen(PORT, () => {
    console.log(`Servidor MMPI-2 corriendo fluidamente en el puerto ${PORT}`);
});