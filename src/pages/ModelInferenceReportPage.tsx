import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Clipboard, Download, FileText, Image as ImageIcon, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { clearPlaygroundReport, loadPlaygroundReport, type PlaygroundReportPayload, updatePlaygroundReport } from "../lib/playgroundReport";
import { createDiagnosticDraft } from "../lib/diagnosticReportApi";

export function ModelInferenceReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState<PlaygroundReportPayload | null>(null);
  const [draft, setDraft] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const saved = loadPlaygroundReport();
    if (!saved) {
      navigate("/playground");
      return;
    }

    setPayload(saved);
    setDraft(saved.generatedReport?.draft ?? saved.clientDraft ?? "");
  }, [user, navigate]);

  useEffect(() => {
    const generateReport = async () => {
      if (!payload) return;
      if (payload.generatedReport?.draft) {
        setDraft(payload.generatedReport.draft);
        return;
      }

      try {
        setIsGenerating(true);
        setGenerationError("");
        const generatedReport = await createDiagnosticDraft(payload);
        const nextPayload = updatePlaygroundReport({ generatedReport });
        setPayload(nextPayload);
        setDraft(generatedReport.draft);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.";
        setGenerationError(message);
        setDraft(payload.clientDraft ?? "");
      } finally {
        setIsGenerating(false);
      }
    };

    generateReport();
  }, [payload]);

  if (!user || !payload) {
    return null;
  }

  const summaryText =
    payload.generatedReport?.summary ?? "AI 서버가 리포트 요약을 아직 생성하지 않았습니다.";
  const findingsText =
    payload.generatedReport?.findings ?? "생성된 상세 소견이 없습니다.";
  const recommendations = payload.generatedReport?.recommendations ?? [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 1500);
    } catch (error) {
      console.error("리포트 복사 실패", error);
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `helios_report_${payload.modelId}_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cohere-page py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/playground")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            AI 진단실로 돌아가기
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearPlaygroundReport();
              navigate("/playground");
            }}
          >
            새 진단 시작
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">진단 리포트</h1>
          <p className="text-gray-600">AI 진단 결과를 바탕으로 생성된 초안을 검토하고 수정할 수 있습니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="w-full">
            <Card className="p-8 border-2 shadow-sm lg:sticky lg:top-8">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-800">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                진단 이미지
              </h3>
              <div className="rounded-xl overflow-hidden border bg-black min-h-[420px] flex items-center justify-center">
                <img src={payload.imageUrl} alt="Diagnostic Preview" className="w-full h-full max-h-[680px] object-contain" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-gray-500">
                <p className="truncate">{payload.imageFileName}</p>
                <p>{payload.domainLabel}</p>
              </div>
            </Card>
          </div>

          <div className="w-full">
            <Card className="p-8 border-2 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                      <FileText className="w-6 h-6 text-[#0f62fe]" />
                      진단 리포트 초안
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      자동 생성된 초안입니다. 필요한 표현으로 수정한 뒤 복사하거나 다운로드할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generationError && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            setIsGenerating(true);
                            setGenerationError("");
                            const generatedReport = await createDiagnosticDraft(payload);
                            const nextPayload = updatePlaygroundReport({ generatedReport });
                            setPayload(nextPayload);
                            setDraft(generatedReport.draft);
                          } catch (error) {
                            const message =
                              error instanceof Error ? error.message : "리포트 재생성에 실패했습니다.";
                            setGenerationError(message);
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        재시도
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleCopy}>
                      <Clipboard className="w-4 h-4 mr-2" />
                      {copySuccess ? "복사됨" : "복사"}
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      TXT 저장
                    </Button>
                  </div>
                </div>

                {isGenerating && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 서버에서 진단 리포트 초안을 생성 중입니다.
                  </div>
                )}

                {generationError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {generationError}
                  </div>
                )}

                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[720px] w-full rounded-lg border border-gray-300 bg-white p-4 text-sm leading-7 text-gray-800 shadow-sm focus:border-[#0f62fe] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </Card>
          </div>

          <div className="w-full">
            <Card className="p-8 border-2 shadow-sm lg:sticky lg:top-8">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-800">
                <AlertCircle className="w-6 h-6 text-[#0f62fe]" />
                결과 요약
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">사용 모델</p>
                  <p className="font-semibold text-gray-900">{payload.modelTitle}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">생성 시각</p>
                  <p className="font-semibold text-gray-900">
                    {payload.generatedReport?.generatedAt ?? payload.generatedAt}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-3">상위 예측 결과</p>
                  <div className="space-y-2">
                    {payload.results.slice(0, 5).map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{index + 1}. {item.name}</span>
                        <span className="font-semibold text-gray-900">{item.score.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">LLM 요약</p>
                    <p className="text-sm text-gray-800 leading-6">{summaryText}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">상세 소견</p>
                    <p className="text-sm text-gray-800 leading-6">{findingsText}</p>
                  </div>
                  {recommendations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">권고 사항</p>
                      <div className="space-y-1">
                        {recommendations.map((item, index) => (
                          <p key={`${item}-${index}`} className="text-sm text-gray-800 leading-6">
                            {index + 1}. {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
