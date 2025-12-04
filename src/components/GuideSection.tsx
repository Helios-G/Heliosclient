export function GuideSection() {
  const steps = [
    {
      number: "1",
      title: "회원가입 신청",
      description: "회원가입 시 신청 정보가 관리자에게 전달됩니다.\n승인절차는 영업일 기준 1~2일 소요됩니다."
    },
    {
      number: "2",
      title: "가입 승인",
      description: "병원 증명 및 가입 승인이 완료되면 Helios의 서비스를 자유롭게 이용하실 수 있습니다."
    },
    {
      number: "3",
      title: "학습 참여하기, 모델 다운로드",
      description: "세션에 참여하여 모델을 학습시키고, 배포된 모델들 다운로드 해 전단에 활용해보세요.\n학습에 참여하지 않아도 모델 사용이 가능합니다."
    }
  ];

  return (
    <section id="guide" className="py-20" style={{ backgroundColor: '#FEF3F3' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-gray-800">서비스 사용법</h2>
          <p className="max-w-2xl mx-auto text-gray-700">
            간단한 3단계로 HELIOS 서비스를 시작할 수 있습니다.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-6"
            >
              <div 
                className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FF9500' }}
              >
                <span className="text-white text-2xl">
                  {step.number}
                </span>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="mb-2 text-gray-800">
                  {step.title}
                </h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}