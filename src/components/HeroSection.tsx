import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  FileSearch,
  Layers3,
  Network,
  ScanLine,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";

const workspaceCards = [
  {
    icon: Network,
    label: "Create",
    title: "Session",
    tone: "blue",
  },
  {
    icon: UploadCloud,
    label: "Prepare",
    title: "Labeling",
    tone: "cyan",
  },
  {
    icon: FileSearch,
    label: "Review",
    title: "AI Review",
    tone: "violet",
  },
];

const workflowItems = [
  {
    icon: UploadCloud,
    label: "Data",
    meta: "Local",
  },
  {
    icon: ScanLine,
    label: "Auto Label",
    meta: "CheXpert",
  },
  {
    icon: Layers3,
    label: "Model",
    meta: "Merge",
  },
  {
    icon: FileSearch,
    label: "Report",
    meta: "AI Draft",
  },
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
                <p>Workspace preview</p>
                <h2>Private learning flow</h2>
              </div>
              <span>Local-first</span>
            </div>

            <div className="cohere-metrics-grid">
              {workspaceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.label} className={`cohere-metric-card tone-${card.tone}`}>
                    <Icon className="h-5 w-5" />
                    <div>
                      <p>{card.label}</p>
                      <strong>{card.title}</strong>
                    </div>
                  </article>
                );
              })}
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
                {workflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="cohere-stage-item">
                      <div className="cohere-stage-meta">
                        <span>
                          <Icon className="h-4 w-4" />
                          <strong>{item.label}</strong>
                          <em>{item.meta}</em>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
