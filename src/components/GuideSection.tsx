const steps = [
  ["01", "Create", "세션 도메인, 참여 기관 수, 라운드 수를 정의합니다."],
  ["02", "Label", "기관별 브라우저에서 의료 이미지를 라벨링하고 tensor를 준비합니다."],
  ["03", "Train", "AI 서버가 클라이언트 fit과 FedAvg aggregation을 조율합니다."],
  ["04", "Review", "결과와 진단 리포트 초안을 검토 가능한 형태로 정리합니다."],
];

export function GuideSection() {
  return (
    <section id="guide" className="cohere-flow-section">
      <div className="cohere-flow-panel">
        <div className="cohere-flow-copy">
          <p>Clinical workflow</p>
          <h2>데이터가 떠나지 않는 협업형 학습 루프</h2>
          <span>
            HELIOS의 메인 흐름은 세션 생성에서 진단 리뷰까지 이어지는 하나의 AI 운영 루프입니다.
          </span>
        </div>

        <div className="cohere-flow-steps">
          {steps.map(([number, title, description]) => (
            <article key={number}>
              <strong>{number}</strong>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
