import { Activity, DatabaseZap, FileText, ScanSearch } from "lucide-react";

const features = [
  {
    icon: DatabaseZap,
    title: "Labeling workbench",
    description: "자동/수동 라벨링으로 학습 가능한 train/test tensor를 준비합니다.",
    metric: "xTrain / yTrain",
  },
  {
    icon: Activity,
    title: "Round telemetry",
    description: "라운드 진행률, loss, accuracy, 클라이언트 응답을 한눈에 추적합니다.",
    metric: "5 FL rounds",
  },
  {
    icon: ScanSearch,
    title: "Domain screening",
    description: "세션 도메인과 업로드 이미지의 적합도를 학습 전 검증합니다.",
    metric: "94% match",
  },
  {
    icon: FileText,
    title: "Report drafting",
    description: "진단실 결과를 검토 가능한 리포트 초안으로 정리합니다.",
    metric: "AI summary",
  },
];

export function FeaturesSection() {
  return (
    <section id="about" className="cohere-feature-section">
      <div className="cohere-section-heading">
        <p>Operational AI stack</p>
        <h2>진단 AI 학습의 복잡한 흐름을 하나의 제품 경험으로 묶습니다.</h2>
      </div>

      <div className="cohere-feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="cohere-feature-card">
            <div className="cohere-feature-icon">
              <feature.icon className="h-5 w-5" />
            </div>
            <span>{feature.metric}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
