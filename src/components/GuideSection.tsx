export function GuideSection() {
  const steps = [
    {
      number: "01",
      title: "회원가입",
      description: "간단한 정보 입력으로 HELIOS 회원이 되세요."
    },
    {
      number: "02",
      title: "서비스 선택",
      description: "필요한 서비스를 선택하고 맞춤 설정을 진행하세요."
    },
    {
      number: "03",
      title: "시작하기",
      description: "모든 준비가 완료되면 바로 서비스를 이용하실 수 있습니다."
    }
  ];

  return (
    <section id="guide" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4" style={{ color: '#6B3131' }}>서비스 사용법</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            간단한 3단계로 HELIOS 서비스를 시작할 수 있습니다.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-6 mb-12 last:mb-0"
            >
              <div 
                className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FF9500' }}
              >
                <span className="text-white" style={{ fontSize: '1.5rem' }}>
                  {step.number}
                </span>
              </div>
              <div className="flex-1 pt-4">
                <h3 className="mb-2" style={{ color: '#6B3131' }}>
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-10 mt-20 w-0.5 h-12 bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
