const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const services = {
  meloTTS: { 
    name: "MeloTTS", 
    path: "C:/Users/sgins/AI_STACK/MeloTTS", 
    startCommand: "python app.py", 
    port: 8001, 
    webInterface: true, 
    description: "Text-to-Speech synthesis" 
  },
  openManus: { 
    name: "OpenManus", 
    path: "C:/Users/sgins/AI_STACK/OpenManus", 
    startCommand: "python main.py", 
    port: 8002, 
    webInterface: true, 
    description: "AI agent framework" 
  },
  openSora: { 
    name: "OpenSora", 
    path: "C:/Users/sgins/AI_STACK/OpenSora", 
    startCommand: "python opensora_web.py", 
    port: 8003, 
    webInterface: true, 
    description: "Video generation AI" 
  }
};

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

  res.json(services);
});

  socket.emit('services-list', services);
});

const PORT = process.env.PORT 
  console.log('AI Stack Dashboard running on http://localhost:' + PORT);
});
