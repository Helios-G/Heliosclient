import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1568952433726-3896e3881c65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbnxlbnwxfHx8fDE3NjEyMzQ5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Technology Innovation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center text-white">
        <h1 className="mb-6" style={{ fontSize: '3.5rem', color: '#FF9500' }}>
          HELIOS
        </h1>
        <p className="mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.25rem' }}>
          혁신적인 기술로 여러분의 비즈니스를 더 밝게 비춥니다.<br />
          HELIOS와 함께 새로운 가능성을 발견하세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            style={{ backgroundColor: '#FF9500' }}
            className="text-white hover:opacity-90 px-8 py-6"
          >
            시작하기
          </Button>
          <Button 
            variant="outline"
            className="bg-white/10 text-white border-white hover:bg-white/20 px-8 py-6"
          >
            더 알아보기
          </Button>
        </div>
      </div>
    </section>
  );
}
