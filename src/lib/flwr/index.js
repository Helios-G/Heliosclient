export class Flwr {
  constructor() {
    this.ws = null;
  }

  async connect(url, client) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("✅ Connected to Flower Server");
        // 여기서 resolve()를 하지 않고 기다립니다!
      };

      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
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
        resolve(); // 이제야 함수가 끝나고 '완료' 화면으로 넘어감
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        reject(err);
      };
    });
  }
}

export class FlowerClient {
  async getParameters() { throw new Error("Not implemented"); }
  async fit(parameters, config) { throw new Error("Not implemented"); }
  async evaluate(parameters, config) { throw new Error("Not implemented"); }
}