import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import config from './config';
import {WebSocket} from 'ws';
import {IncomingMessage, Pixel} from './types';

const app = express();
const port = 8000;
expressWs(app);

app.use(cors(config.corsOptions));
const canvasRouter = express.Router();

const connectedClients: WebSocket[] = [];
const canvasData: Pixel[] = [];

canvasRouter.ws('/canvas', (ws, req) => {
  connectedClients.push(ws);
  console.log('client connected, total clients:', connectedClients.length);

  if (canvasData.length > 0) {
    ws.send(JSON.stringify({
      type: 'EXISTING_PIXELS',
      payload: canvasData,
    }));
  }

  ws.on('message', (message) => {
    try {
      const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

      if (decodedMessage.type === 'DRAW_PIXELS') {
        canvasData.push(...decodedMessage.payload);

        connectedClients.forEach((clientWs) => {
          clientWs.send(JSON.stringify({
            type: 'UPDATE_CANVAS',
            payload: decodedMessage.payload,
          }));
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    console.log('client disconnected');
    const index = connectedClients.indexOf(ws);
    connectedClients.splice(index, 1);
  });
});

app.use(canvasRouter);

app.listen(port, () => {
  console.log(`Server started on ${port} port!`);
});