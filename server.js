require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const path = require('path');
const qr = require('qr-image');
const bwipjs = require('bwip-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Modelos
const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fechaRegistro: { type: Date, default: Date.now }
});

const prendaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  talla: { type: String, required: true },
  precio: { type: Number, required: true },
  imagen: { type: String, required: true },
  usuario: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Prenda = mongoose.model('Prenda', prendaSchema);

// Rutas API
app.post('/api/usuarios', async (req, res) => {
  try {
    const usuario = new Usuario({ username: req.body.username });
    await usuario.save();
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/prendas', async (req, res) => {
  try {
    const prenda = new Prenda(req.body);
    await prenda.save();
    
    // Emitir a todos los clientes
    io.emit('nueva_prenda', prenda);
    
    res.status(201).json(prenda);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/prendas', async (req, res) => {
  try {
    const prendas = await Prenda.find().sort({ fechaCreacion: -1 });
    res.json(prendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/qr/:texto', (req, res) => {
  try {
    const qr_png = qr.image(req.params.texto, { type: 'png' });
    res.type('png');
    qr_png.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/barcode/:texto', (req, res) => {
  try {
    bwipjs.toBuffer({
      bcid: 'code128',
      text: req.params.texto,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    }, (err, png) => {
      if (err) throw err;
      res.type('png');
      res.send(png);
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Servidor
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor en puerto ${server.address().port}`);
});

// Socket.io
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});