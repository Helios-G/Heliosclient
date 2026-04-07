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
import { mockContributedModels } from "../data/mockContributedModels";

export function MyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [contributionHistory] = useState(mockContributedModels);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = () => {
    console.log("계정 탈퇴 처리");
    logout();
    navigate("/");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#FFF5EB" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 style={{ color: "#6B3131" }}>회원 정보</h1>
          <p className="mt-2 text-gray-600">
            병원 계정 정보를 확인하고 관리하세요
          </p>
        </div>

        <Card className="p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: "#6B3131" }}>병원 정보</h2>
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
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">병원명</p>
                <p className="mt-1">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">병원 아이디 (이메일)</p>
                <p className="mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">사업자번호</p>
                <p className="mt-1">{user.businessNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">담당자 이름</p>
                <p className="mt-1">{user.managerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="mt-1">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 mt-0.5" style={{ color: "#FF9500" }} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">주소</p>
                <p className="mt-1">{user.address}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5" style={{ color: "#FF9500" }} />
            <h2 style={{ color: "#6B3131" }}>모델 기여 이력</h2>
          </div>

          {contributionHistory.length > 0 ? (
            <div className="space-y-3">
              {contributionHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/model/${item.id}`)}
                >
                  <div className="flex-1">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-gray-500">버전</p>
                        <p className="mt-1 font-medium text-gray-900">{item.version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">세션 제목</p>
                        <p className="mt-1 font-medium text-gray-900">{item.sessionTitle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">학습 완료 날짜</p>
                        <p className="mt-1 font-medium text-gray-900">{item.completedAt}</p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
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
              아직 기여한 모델 이력이 없습니다.
            </div>
          )}
        </Card>

        <Card className="p-8 shadow-lg">
          <h2 className="mb-6" style={{ color: "#6B3131" }}>계정 관리</h2>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {}}
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
                      style={{ backgroundColor: "#d4183d" }}
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
