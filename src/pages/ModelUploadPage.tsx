import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  X,
  Cloud
} from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadResult {
  status: UploadStatus;
  message: string;
  fileName?: string;
}

export function ModelUploadPage() {
  const { hospital } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult>({
    status: "idle",
    message: ""
  });
  const [isDragging, setIsDragging] = useState(false);

  // 로그인 체크
  if (!hospital) {
    navigate("/login");
    return null;
  }

  // 허용된 파일 확장자
  const allowedExtensions = ['.h5', '.pb', '.pt', '.pth', '.onnx', '.pkl'];
  
  const handleFileSelect = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadResult({
        status: "error",
        message: `지원하지 않는 파일 형식입니다. (${allowedExtensions.join(', ')} 파일만 업로드 가능)`
      });
      return;
    }

    // 파일 크기 체크 (예: 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadResult({
        status: "error",
        message: "파일 크기가 너무 큽니다. (최대 500MB)"
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult({ status: "idle", message: "" });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadResult({ status: "uploading", message: "업로드 중..." });
    setUploadProgress(0);

    // 실제로는 API 호출
    // 여기서는 시뮬레이션
    try {
      // 진행률 시뮬레이션
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 4000));
      
      clearInterval(interval);
      setUploadProgress(100);

      setUploadResult({
        status: "success",
        message: "모델이 성공적으로 업로드되었습니다!",
        fileName: selectedFile.name
      });

      // 성공 후 파일 초기화
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);

    } catch (error) {
      setUploadResult({
        status: "error",
        message: "업로드 중 오류가 발생했습니다. 다시 시도해주세요."
      });
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadResult({ status: "idle", message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: '#6B3131' }}>모델 업로드</h1>
          <p className="mt-2 text-gray-600">
            연합학습을 위한 로컬 학습 모델을 업로드하세요
          </p>
        </div>

        {/* 가이드 섹션 */}
        <Card className="p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
            <div>
              <h3 className="mb-2" style={{ color: '#6B3131' }}>업로드 가이드</h3>
            </div>
          </div>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>지원 파일 형식: <span className="font-mono text-sm">{allowedExtensions.join(', ')}</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>최대 파일 크기: 500MB</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>업로드된 모델은 연합학습 서버에서 검증 과정을 거칩니다</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>개인정보가 포함되지 않은 순수 모델 파라미터만 업로드해주세요</p>
            </div>
          </div>
        </Card>

        {/* 주의사항 */}
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">주의사항</AlertTitle>
          <AlertDescription className="text-yellow-700">
            업로드하는 모델에는 환자 데이터나 개인정보가 포함되어서는 안 됩니다. 
            모델 파라미터(가중치)만 포함되어야 합니다.
          </AlertDescription>
        </Alert>

        {/* 업로드 영역 */}
        <Card className="p-8 mb-6 shadow-lg">
          <h3 className="mb-6" style={{ color: '#6B3131' }}>파일 선택</h3>

          {/* 드래그 앤 드롭 영역 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging 
                ? 'border-[#FF9500] bg-orange-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Cloud className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: '#FF9500' }} />
                  <span>{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0"
                    disabled={uploadResult.status === "uploading"}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  크기: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <p className="mb-2">
                  파일을 드래그하여 놓거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {allowedExtensions.join(', ')} 파일 (최대 500MB)
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={allowedExtensions.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
              disabled={uploadResult.status === "uploading"}
            />
            
            {!selectedFile && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: '#FF9500' }}
                className="text-white mt-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                파일 선택
              </Button>
            )}
          </div>

          {/* 업로드 버튼 */}
          {selectedFile && uploadResult.status !== "uploading" && (
            <div className="mt-6">
              <Button
                onClick={handleUpload}
                style={{ backgroundColor: '#FF9500' }}
                className="text-white w-full py-6"
                disabled={uploadResult.status === "uploading"}
              >
                <Upload className="w-5 h-5 mr-2" />
                모델 업로드 시작
              </Button>
            </div>
          )}

          {/* 업로드 진행중 UI */}
          {uploadResult.status === "uploading" && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-gray-500 text-center">
                업로드가 완료될 때까지 페이지를 닫지 마세요
              </p>
            </div>
          )}
        </Card>

        {/* 결과 메시지 */}
        {uploadResult.status === "success" && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">업로드 완료</AlertTitle>
            <AlertDescription className="text-green-700">
              {uploadResult.message}
              <br />
              <span className="text-sm">
                업로드된 모델은 검증 후 연합학습에 활용됩니다.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {uploadResult.status === "error" && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">업로드 실패</AlertTitle>
            <AlertDescription className="text-red-700">
              {uploadResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 최근 업로드 이력 안내 */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-3">
            업로드 이력은 회원 정보 페이지에서 확인할 수 있습니다
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/mypage')}
          >
            회원 정보 페이지로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
