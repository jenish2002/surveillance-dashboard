import type { ServerWebSocket } from "bun";

const clients = new Set<ServerWebSocket<unknown>>();

export function addClient(
  ws: ServerWebSocket<unknown>,
) {
  clients.add(ws);
}

export function removeClient(
  ws: ServerWebSocket<unknown>,
) {
  clients.delete(ws);
}

export const broadcast = (data: unknown) => {
  const message = JSON.stringify(data);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
