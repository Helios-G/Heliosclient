import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function HeroSection() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [
    "https://images.unsplash.com/photo-1683225831293-6d289c20e963?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMHRvdWNoaW5nJTIwdGVjaG5vbG9neSUyMGFpfGVufDF8fHx8MTc2NDg0OTgyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1758202292826-c40e172eed1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwQUklMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2NDg1MDMwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1758691463203-cce9d415b2b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwZGlnaXRhbCUyMGlubm92YXRpb258ZW58MXx8fHwxNzY0ODUwMzA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // 5초마다 이미지 전환

    return () => clearInterval(interval);
  }, []);

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartClick = () => {
    if (isLoggedIn) {
      navigate('/upload'); // 회원이면 학습 참여로
    } else {
      navigate('/signup'); // 비회원이면 회원가입으로
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <ImageWithFallback
              src={backgroundImages[currentImageIndex]}
              alt="AI Technology"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center text-white">
        <p className="mb-8 max-w-2xl mx-auto opacity-90">
          HELIOS는 다양한 병원들이 참여하여 학습한<br />
          의료진단 AI를 제공합니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            style={{ backgroundColor: '#FF9500' }}
            className="text-white hover:opacity-90 px-8 py-6"
            onClick={handleStartClick}
          >
            시작하기
          </Button>
          <Button 
            variant="outline"
            className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 py-6"
            onClick={() => handleSectionClick('about')}
          >
            더 알아보기
          </Button>
        </div>
      </div>
    </section>
  );
}