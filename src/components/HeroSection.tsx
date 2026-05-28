import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  DatabaseZap,
  Network,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";

const metrics = [
  { label: "Federated sessions", value: "12", tone: "blue" },
  { label: "Ready datasets", value: "3.8k", tone: "cyan" },
  { label: "Domain confidence", value: "94%", tone: "violet" },
];

const stages = [
  { label: "Upload screened", value: 92 },
  { label: "Client hello", value: 76 },
  { label: "Local fit", value: 61 },
  { label: "FedAvg queued", value: 38 },
];

export function HeroSection() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const startPath = isLoggedIn ? "/session/list" : "/signup";

  return (
    <section className="cohere-home-hero">
      <div className="cohere-hero-inner">
        <div className="cohere-hero-copy">
          <div className="cohere-pill">
            <BrainCircuit className="h-4 w-4" />
            Medical AI collaboration layer
          </div>

          <h1>HELIOS</h1>
          <p className="cohere-hero-lead">
            병원 데이터는 브라우저에 남기고, 학습 신호만 모아 더 안전한 진단 AI를 만드는
            연합학습 플랫폼.
          </p>

          <div className="cohere-hero-actions">
            <Button className="cohere-primary-button" onClick={() => navigate(startPath)}>
              {isLoggedIn ? "세션 콘솔 열기" : "기관 등록 시작"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="cohere-secondary-button" variant="outline" onClick={() => navigate("/playground")}>
              AI 진단실 보기
            </Button>
          </div>

          <div className="cohere-trust-row">
            <span>
              <ShieldCheck className="h-4 w-4" />
              Institution access
            </span>
            <span>
              <DatabaseZap className="h-4 w-4" />
              Browser-local labeling
            </span>
            <span>
              <Network className="h-4 w-4" />
              Federated orchestration
            </span>
          </div>
        </div>

        <div className="cohere-dashboard" aria-label="HELIOS federated learning dashboard preview">
          <div className="cohere-dashboard-glow" />
          <div className="cohere-dashboard-shell">
            <div className="cohere-dashboard-header">
              <div>
                <p>Live session intelligence</p>
                <h2>Federated round monitor</h2>
              </div>
              <span>Round 03 / 05</span>
            </div>

            <div className="cohere-metrics-grid">
              {metrics.map((metric) => (
                <article key={metric.label} className={`cohere-metric-card tone-${metric.tone}`}>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>

            <div className="cohere-main-visual">
              <div className="cohere-orbit">
                <div className="cohere-node cohere-node-a">X-ray</div>
                <div className="cohere-node cohere-node-b">Fundus</div>
                <div className="cohere-node cohere-node-c">AI</div>
                <div className="cohere-core">
                  <Activity className="h-7 w-7" />
                  FedAvg
                </div>
              </div>

              <div className="cohere-stage-list">
                {stages.map((stage, index) => (
                  <div key={stage.label} className="cohere-stage-item">
                    <div className="cohere-stage-meta">
                      <span>
                        <CheckCircle2 className="h-4 w-4" />
                        {stage.label}
                      </span>
                      <em>{stage.value}%</em>
                    </div>
                    <div className="cohere-stage-track">
                      <div style={{ width: `${stage.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
