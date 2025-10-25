import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { 
  Building2, 
  Mail, 
  FileText, 
  Phone, 
  MapPin, 
  User,
  Upload,
  LogOut,
  Trash2
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function MyPage() {
  const { hospital, logout } = useAuth();
  const navigate = useNavigate();
  
  // 임시 데이터 - 실제로는 API에서 가져옴
  const [uploadHistory] = useState([
    { id: 1, fileName: "model_v1.h5", uploadDate: "2025-10-20", status: "완료" },
    { id: 2, fileName: "model_v2.h5", uploadDate: "2025-10-18", status: "완료" },
    { id: 3, fileName: "model_v3.h5", uploadDate: "2025-10-15", status: "처리중" },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = () => {
    // 실제로는 API 호출
    console.log("계정 탈퇴 처리");
    logout();
    navigate("/");
  };

  if (!hospital) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: '#6B3131' }}>회원 정보</h1>
          <p className="mt-2 text-gray-600">
            병원 계정 정보를 확인하고 관리하세요
          </p>
        </div>

        {/* 병원 정보 카드 */}
        <Card className="p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: '#6B3131' }}>병원 정보</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </Button>
          </div>

          <div className="space-y-4">
            {/* 병원명 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">병원명</p>
                <p className="mt-1">{hospital.name}</p>
              </div>
            </div>

            {/* 병원 아이디 (이메일) */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">병원 아이디 (이메일)</p>
                <p className="mt-1">{hospital.email}</p>
              </div>
            </div>

            {/* 사업자번호 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">사업자번호</p>
                <p className="mt-1">{hospital.businessNumber}</p>
              </div>
            </div>

            {/* 담당자 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">담당자 이름</p>
                <p className="mt-1">{hospital.managerName}</p>
              </div>
            </div>

            {/* 전화번호 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="mt-1">{hospital.phone}</p>
              </div>
            </div>

            {/* 주소 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#FF9500' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">주소</p>
                <p className="mt-1">{hospital.address}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 모델 업로드 이력 */}
        <Card className="p-8 mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5" style={{ color: '#FF9500' }} />
            <h2 style={{ color: '#6B3131' }}>모델 업로드 이력</h2>
          </div>

          {uploadHistory.length > 0 ? (
            <div className="space-y-3">
              {uploadHistory.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p>{item.fileName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      업로드 날짜: {item.uploadDate}
                    </p>
                  </div>
                  <div>
                    <span 
                      className={`px-3 py-1 rounded-full text-sm ${
                        item.status === "완료" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              아직 업로드된 모델이 없습니다.
            </div>
          )}
        </Card>

        {/* 계정 관리 */}
        <Card className="p-8 shadow-lg">
          <h2 className="mb-6" style={{ color: '#6B3131' }}>계정 관리</h2>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {/* 비밀번호 변경 기능 */}}
            >
              비밀번호 변경
            </Button>

            <Separator />

            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                계정을 탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    계정 탈퇴
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      style={{ backgroundColor: '#d4183d' }}
                      className="text-white"
                    >
                      탈퇴하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
