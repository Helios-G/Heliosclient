export class Flwr {
  constructor() {
    this.ws = null;
    this.onStatus = null;
  }

  setStatusCallback(callback) {
    this.onStatus = callback;
  }

  async connect(url, client) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      let settled = false;

      this.ws.onopen = async () => {
        console.log("✅ Connected to Flower Server");
        if (typeof client.buildHelloPayload === "function") {
          try {
            const helloPayload = await client.buildHelloPayload();
            this.ws.send(JSON.stringify(helloPayload));
          } catch (err) {
            settled = true;
            reject(err);
            this.ws.close();
          }
        }
      };

      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "admission") {
          if (msg.accepted === false) {
            const reason = msg.reason || "Client admission rejected by screening agent";
            if (!settled) {
              settled = true;
              reject(new Error(reason));
            }
            this.ws.close(1008, reason);
          } else {
            console.log("🛡️ Screening admission accepted:", msg.reason || "accepted");
          }
          return;
        }

        if (msg.type === "status") {
          if (this.onStatus) {
            this.onStatus(msg);
          }
          return;
        }
        
        if (msg.type === "get_parameters") {
          const parameters = await client.getParameters();
          this.ws.send(JSON.stringify({ type: "get_parameters_res", parameters }));
        } 
        else if (msg.type === "fit") {
          const { parameters, config } = msg;
          const fitRes = await client.fit(parameters, config);
          this.ws.send(JSON.stringify({ type: "fit_res", ...fitRes }));
        } 
        else if (msg.type === "evaluate") {
          const { parameters, config } = msg;
          const evalRes = await client.evaluate(parameters, config);
          this.ws.send(JSON.stringify({ type: "evaluate_res", ...evalRes }));
        }
      };

      // ✅ 서버가 연결을 끊거나 에러가 나면 그때서야 끝냅니다.
      this.ws.onclose = () => {
        console.log("🔌 Disconnected from Server");
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        if (!settled) {
          settled = true;
          reject(err);
        }
      };
    });
  }
}

export class FlowerClient {
  async getParameters() { throw new Error("Not implemented"); }
  async fit(parameters, config) { throw new Error("Not implemented"); }
  async evaluate(parameters, config) { throw new Error("Not implemented"); }
}
