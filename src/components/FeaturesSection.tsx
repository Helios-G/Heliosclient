import { Lightbulb, Zap, Shield } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Lightbulb,
      title: "혁신적인 솔루션",
      description: "최첨단 기술을 활용한 창의적인 서비스를 제공합니다."
    },
    {
      icon: Zap,
      title: "빠른 성능",
      description: "최적화된 시스템으로 신속하고 효율적인 서비스를 경험하세요."
    },
    {
      icon: Shield,
      title: "안전한 보안",
      description: "고객의 데이터를 안전하게 보호하는 것이 우리의 최우선 과제입니다."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4" style={{ color: '#6B3131' }}>서비스 설명</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            HELIOS는 고객의 성공을 위해 최선을 다하는 혁신적인 서비스입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: '#FF9500' }}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3" style={{ color: '#6B3131' }}>
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
