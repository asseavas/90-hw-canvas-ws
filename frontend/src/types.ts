export interface Pixel {
  x: number;
  y: number;
}

export interface IncomingMessage {
  type: string;
  payload: Pixel[];
}