import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="cohere-page flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 style={{ color: '#0f62fe', fontSize: '6rem', lineHeight: '1' }}>
          404
        </h1>
        <h2 className="mt-4 mb-4" style={{ color: '#071225' }}>
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 페이지
          </Button>
          <Button
            onClick={() => navigate('/')}
            style={{ backgroundColor: '#0f62fe' }}
            className="text-white gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
