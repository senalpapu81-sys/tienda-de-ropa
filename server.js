const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración básica
const PORT = process.env.PORT || 3000;

// Almacenamiento en memoria (simulando una base de datos)
let prendas = [];
const usuarios = {};

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Manejar nombre de usuario
  socket.on('setUsername', (username) => {
    usuarios[socket.id] = username;
    console.log(`Usuario ${username} registrado con socket ID ${socket.id}`);
  });

  // Obtener todas las prendas
  socket.on('getPrendas', () => {
    socket.emit('prendasActualizadas', prendas);
  });

  // Agregar nueva prenda
  socket.on('addPrenda', (nuevaPrenda) => {
    prendas.unshift(nuevaPrenda);
    io.emit('nuevaPrenda', nuevaPrenda);
    console.log(`Nueva prenda agregada: ${nuevaPrenda.nombre}`);
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id, usuarios[socket.id] || 'Anónimo');
    delete usuarios[socket.id];
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
