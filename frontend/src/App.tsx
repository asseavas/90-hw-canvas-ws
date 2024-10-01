import React, {useEffect, useRef, useState} from 'react';
import {IncomingMessage, Pixel} from './types.ts';
import './App.css';

const App = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/canvas');

    ws.current.onclose = () => console.log('WS disconnected!');

    ws.current.onmessage = (event) => {
      const decodedMessage = JSON.parse(event.data) as IncomingMessage;

      if (decodedMessage.type === 'EXISTING_PIXELS') {
        setPixels(decodedMessage.payload);
      } else if (decodedMessage.type === 'UPDATE_CANVAS') {
        setPixels((prev) => [...prev, ...decodedMessage.payload]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');

      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        pixels.forEach((pixel) => {
          context.fillRect(pixel.x, pixel.y, 2, 2);
        });
      }
    }
  }, [pixels]);

  const handleMouseDown = () => {
    isDrawing.current = true;
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newPixel: Pixel = { x, y };

    if (ws.current) {
      ws.current.send(JSON.stringify({
        type: 'DRAW_PIXELS',
        payload: [newPixel],
      }));
    }

    setPixels((prev) => [...prev, newPixel]);
  };

  return (
    <div className="App">
      <canvas
        ref={canvasRef}
        width={800}
        height={650}
        style={{ border: '2px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      ></canvas>
    </div>
  );
};

export default App;
