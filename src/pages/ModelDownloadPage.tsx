import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { 
  Download, 
  Info,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Database,
  Users,
  TrendingUp,
  FileDown
} from "lucide-react";

interface ModelVersion {
  id: string;
  version: string;
  releaseDate: string;
  description: string;
  fileSize: string;
  participatingHospitals: string[];
  totalHospitals: number;
  performance: {
    accuracy: string;
    precision: string;
    recall: string;
  };
  datasetInfo: {
    totalSamples: number;
    trainingRounds: number;
  };
  status: "latest" | "stable" | "archived";
  downloadUrl: string;
}

export function ModelDownloadPage() {
  const { hospital } = useAuth();
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 로그인 체크
  if (!hospital) {
    navigate("/login");
    return null;
  }

  // 샘플 데이터 - 실제로는 API에서 가져옴
  const modelVersions: ModelVersion[] = [
    {
      id: "v3.2",
      version: "v3.2.0",
      releaseDate: "2025-10-20",
      description: "최신 연합학습 모델입니다. 5개 병원의 데이터로 학습되었으며, 이전 버전 대비 정확도가 5% 향상되었습니다.",
      fileSize: "245 MB",
      participatingHospitals: [
        "서울중앙병원",
        "연세세브란스병원",
        "삼성서울병원",
        "서울아산병원",
        "고려대학교병원"
      ],
      totalHospitals: 5,
      performance: {
        accuracy: "94.5%",
        precision: "93.2%",
        recall: "95.1%"
      },
      datasetInfo: {
        totalSamples: 125000,
        trainingRounds: 50
      },
      status: "latest",
      downloadUrl: "/models/helios_v3.2.0.h5"
    },
    {
      id: "v3.1",
      version: "v3.1.0",
      releaseDate: "2025-10-10",
      description: "안정적인 성능을 제공하는 모델입니다. 프로덕션 환경에서 검증되었습니다.",
      fileSize: "238 MB",
      participatingHospitals: [
        "서울중앙병원",
        "연세세브란스병원",
        "삼성서울병원",
        "서울아산병원"
      ],
      totalHospitals: 4,
      performance: {
        accuracy: "92.8%",
        precision: "91.5%",
        recall: "93.4%"
      },
      datasetInfo: {
        totalSamples: 98000,
        trainingRounds: 45
      },
      status: "stable",
      downloadUrl: "/models/helios_v3.1.0.h5"
    },
    {
      id: "v3.0",
      version: "v3.0.0",
      releaseDate: "2025-09-25",
      description: "이전 버전의 안정적인 모델입니다. 레거시 시스템 호환성이 필요한 경우 사용하세요.",
      fileSize: "230 MB",
      participatingHospitals: [
        "서울중앙병원",
        "연세세브란스병원",
        "삼성서울병원"
      ],
      totalHospitals: 3,
      performance: {
        accuracy: "90.2%",
        precision: "89.8%",
        recall: "91.1%"
      },
      datasetInfo: {
        totalSamples: 75000,
        trainingRounds: 40
      },
      status: "archived",
      downloadUrl: "/models/helios_v3.0.0.h5"
    }
  ];

  const handleDownload = async (model: ModelVersion) => {
    setDownloadingId(model.id);
    setDownloadStatus(null);

    try {
      // 실제로는 API 호출하여 다운로드 링크 받기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 다운로드 시뮬레이션
      const link = document.createElement('a');
      link.href = model.downloadUrl;
      link.download = `helios_${model.version}.h5`;
      // link.click(); // 실제 다운로드는 주석 처리

      setDownloadStatus({
        success: true,
        message: `${model.version} 모델 다운로드가 시작되었습니다.`
      });

      setDownloadingId(null);
    } catch (error) {
      setDownloadStatus({
        success: false,
        message: "다운로드 중 오류가 발생했습니다. 다시 시도해주세요."
      });
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "latest":
        return <Badge style={{ backgroundColor: '#FF9500' }} className="text-white">최신 버전</Badge>;
      case "stable":
        return <Badge variant="outline" className="border-green-600 text-green-700">안정 버전</Badge>;
      case "archived":
        return <Badge variant="outline" className="border-gray-400 text-gray-600">이전 버전</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: '#6B3131' }}>모델 다운로드</h1>
          <p className="mt-2 text-gray-600">
            연합학습으로 생성된 글로벌 모델을 다운로드하세요
          </p>
        </div>

        {/* 가이드 섹션 */}
        <Card className="p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
            <div>
              <h3 className="mb-2" style={{ color: '#6B3131' }}>다운로드 가이드</h3>
            </div>
          </div>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>연합학습으로 생성된 모델은 여러 병원의 데이터로 학습되어 일반화 성능이 우수합니다</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>최신 버전은 가장 많은 병원이 참여하고 성능이 개선된 모델입니다</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>안정 버전은 프로덕션 환경에서 충분히 검증된 모델입니다</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9500' }}>•</span>
              <p>다운로드한 모델은 귀 병원의 시스템에 통합하여 사용할 수 있습니다</p>
            </div>
          </div>
        </Card>

        {/* 주의사항 */}
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">주의사항</AlertTitle>
          <AlertDescription className="text-yellow-700">
            다운로드한 모델은 의료 목적으로만 사용해야 하며, 
            재배포나 상업적 용도로 사용할 수 없습니다. 
            모델 사용 시 귀 병원의 IRB 승인을 받으시기 바랍니다.
          </AlertDescription>
        </Alert>

        {/* 결과 메시지 */}
        {downloadStatus && (
          <Alert className={`mb-6 ${
            downloadStatus.success 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
          }`}>
            {downloadStatus.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className={downloadStatus.success ? 'text-green-800' : 'text-red-800'}>
              {downloadStatus.success ? '다운로드 시작' : '다운로드 실패'}
            </AlertTitle>
            <AlertDescription className={downloadStatus.success ? 'text-green-700' : 'text-red-700'}>
              {downloadStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 모델 버전 목록 */}
        <div className="space-y-6">
          <h2 style={{ color: '#6B3131' }}>사용 가능한 모델 버전</h2>
          
          {modelVersions.map((model) => (
            <Card key={model.id} className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 style={{ color: '#6B3131' }}>{model.version}</h3>
                  {getStatusBadge(model.status)}
                </div>
                <Button
                  onClick={() => handleDownload(model)}
                  disabled={downloadingId === model.id}
                  style={{ backgroundColor: '#FF9500' }}
                  className="text-white gap-2"
                >
                  {downloadingId === model.id ? (
                    <>다운로드 중...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      다운로드
                    </>
                  )}
                </Button>
              </div>

              {/* 설명 */}
              <p className="text-gray-700 mb-4">{model.description}</p>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">출시일</p>
                    <p className="text-sm">{model.releaseDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">파일 크기</p>
                    <p className="text-sm">{model.fileSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">참여 병원</p>
                    <p className="text-sm">{model.totalHospitals}개 병원</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">학습 라운드</p>
                    <p className="text-sm">{model.datasetInfo.trainingRounds}회</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 상세 정보 아코디언 */}
              <Accordion type="single" collapsible>
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="text-sm hover:no-underline py-2">
                    상세 정보 보기
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      {/* 성능 지표 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4" style={{ color: '#FF9500' }} />
                          <h4>모델 성능 지표</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pl-6">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">정확도 (Accuracy)</p>
                            <p className="text-lg" style={{ color: '#6B3131' }}>
                              {model.performance.accuracy}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">정밀도 (Precision)</p>
                            <p className="text-lg" style={{ color: '#6B3131' }}>
                              {model.performance.precision}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">재현율 (Recall)</p>
                            <p className="text-lg" style={{ color: '#6B3131' }}>
                              {model.performance.recall}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 참여 병원 목록 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4" style={{ color: '#FF9500' }} />
                          <h4>참여 병원 목록</h4>
                        </div>
                        <div className="pl-6">
                          <div className="flex flex-wrap gap-2">
                            {model.participatingHospitals.map((hospitalName, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={
                                  hospitalName === hospital.name
                                    ? "border-[#FF9500] bg-orange-50 text-[#6B3131]"
                                    : ""
                                }
                              >
                                {hospitalName}
                                {hospitalName === hospital.name && " (귀 병원)"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 데이터셋 정보 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="w-4 h-4" style={{ color: '#FF9500' }} />
                          <h4>학습 데이터 정보</h4>
                        </div>
                        <div className="pl-6 space-y-2 text-sm text-gray-700">
                          <p>
                            • 총 학습 샘플: <span>{model.datasetInfo.totalSamples.toLocaleString()}개</span>
                          </p>
                          <p>
                            • 연합학습 라운드: <span>{model.datasetInfo.trainingRounds}회</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            * 모든 학습 데이터는 각 병원에서 로컬로 보관되며, 
                            모델 파라미터만 공유됩니다
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </div>

        {/* 추가 안내 */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 text-blue-600" />
            <div>
              <h4 className="mb-2 text-blue-900">모델 통합 지원</h4>
              <p className="text-sm text-blue-800">
                다운로드한 모델을 귀 병원의 시스템에 통합하는데 어려움이 있으시면 
                기술 지원팀에 문의해주세요. 모델 사용 가이드 문서도 함께 제공됩니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-blue-600 text-blue-700 hover:bg-blue-100"
              >
                기술 지원 요청하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
