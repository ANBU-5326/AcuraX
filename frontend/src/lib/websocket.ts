export class WebSocketClient {
  private url: string;
  private socket: WebSocket | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (typeof window === "undefined") return;
    this.socket = new WebSocket(this.url);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
