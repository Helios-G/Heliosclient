import { Zap, Tag, Brain } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "편리함",
      description: "클릭으로만 진행되는 손쉬운 사용법"
    },
    {
      icon: Tag,
      title: "라벨링 지원",
      description: "자동 라벨링, 수동라벨링 방식 지원"
    },
    {
      icon: Brain,
      title: "학습 모델 지원",
      description: "다양한 ai 모델 버전을 지원"
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 max-w-3xl mx-auto text-gray-800">
            병원에서 모델을 손쉽게 다운받아 사용할 수 있도록 편리한 서비스 어쩌고
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut"
      }}
      className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
    >
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
          style={{ backgroundColor: '#FFF4E6' }}
        >
          <feature.icon className="w-8 h-8" style={{ color: '#FF9500' }} />
        </div>
        <h3 className="mb-3 text-gray-800">
          {feature.title}
        </h3>
        <p className="text-gray-600">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}