import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { 
  Shield, 
  UserCheck, 
  Mail,
  Building2,
  XCircle,
  CheckCircle,
  Ban,
  Trash2,
  Plus,
  Edit,
  FileText,
  Clock
} from "lucide-react";
import { toast } from "sonner@2.0.3";

// 타입 정의
interface SignUpRequest {
  id: string;
  hospitalName: string;
  email: string;
  businessNumber: string;
  phone: string;
  address: string;
  managerName: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

interface Whitelist {
  id: string;
  hospitalName: string;
  emailDomain: string;
  addedDate: string;
}

interface BlockedHospital {
  id: string;
  hospitalName: string;
  email: string;
  reason: string;
  blockedDate: string;
}

interface UploadedModel {
  id: string;
  hospitalName: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: "pending" | "approved" | "rejected";
  version?: string;
}

export function AdminPage() {
  const { isAdmin, hospital } = useAuth();
  const navigate = useNavigate();

  // 관리자 권한 체크
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  // 상태 관리
  const [signUpRequests, setSignUpRequests] = useState<SignUpRequest[]>([
    {
      id: "REQ001",
      hospitalName: "고려대학교병원",
      email: "admin@kumc.or.kr",
      businessNumber: "234-56-78901",
      phone: "02-2345-6789",
      address: "서울특별시 성북구",
      managerName: "김철수",
      requestDate: "2025-10-25",
      status: "pending"
    },
    {
      id: "REQ002",
      hospitalName: "부산백병원",
      email: "contact@paik.ac.kr",
      businessNumber: "345-67-89012",
      phone: "051-3456-7890",
      address: "부산광역시 진구",
      managerName: "이영희",
      requestDate: "2025-10-24",
      status: "pending"
    }
  ]);

  const [whitelists, setWhitelists] = useState<Whitelist[]>([
    { id: "WL001", hospitalName: "서울중앙병원", emailDomain: "@central.or.kr", addedDate: "2025-09-15" },
    { id: "WL002", hospitalName: "연세세브란스병원", emailDomain: "@severance.or.kr", addedDate: "2025-09-16" },
    { id: "WL003", hospitalName: "삼성서울병원", emailDomain: "@samsung.com", addedDate: "2025-09-17" },
  ]);

  const [blockedHospitals, setBlockedHospitals] = useState<BlockedHospital[]>([
    {
      id: "BL001",
      hospitalName: "테스트병원",
      email: "test@test.com",
      reason: "의심스러운 활동 감지",
      blockedDate: "2025-10-20"
    }
  ]);

  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([
    {
      id: "MOD001",
      hospitalName: "서울중앙병원",
      fileName: "model_central_v1.h5",
      fileSize: "234 MB",
      uploadDate: "2025-10-23",
      status: "pending"
    },
    {
      id: "MOD002",
      hospitalName: "연세세브란스병원",
      fileName: "model_severance_v2.h5",
      fileSize: "245 MB",
      uploadDate: "2025-10-22",
      status: "approved",
      version: "v3.2.0"
    }
  ]);

  // 화이트리스트 추가 다이얼로그
  const [newWhitelist, setNewWhitelist] = useState({ hospitalName: "", emailDomain: "" });
  const [isWhitelistDialogOpen, setIsWhitelistDialogOpen] = useState(false);

  // 회원가입 승인/거부
  const handleApproveSignUp = (id: string) => {
    setSignUpRequests(prev => 
      prev.map(req => req.id === id ? { ...req, status: "approved" as const } : req)
    );
    toast.success("회원가입 신청이 승인되었습니다.");
  };

  const handleRejectSignUp = (id: string) => {
    setSignUpRequests(prev => 
      prev.map(req => req.id === id ? { ...req, status: "rejected" as const } : req)
    );
    toast.error("회원가입 신청이 거부되었습니다.");
  };

  // 화이트리스트 관리
  const handleAddWhitelist = () => {
    if (!newWhitelist.hospitalName || !newWhitelist.emailDomain) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    const newEntry: Whitelist = {
      id: `WL${String(whitelists.length + 1).padStart(3, '0')}`,
      hospitalName: newWhitelist.hospitalName,
      emailDomain: newWhitelist.emailDomain,
      addedDate: new Date().toISOString().split('T')[0]
    };

    setWhitelists(prev => [...prev, newEntry]);
    setNewWhitelist({ hospitalName: "", emailDomain: "" });
    setIsWhitelistDialogOpen(false);
    toast.success("화이트리스트에 추가되었습니다.");
  };

  const handleDeleteWhitelist = (id: string) => {
    setWhitelists(prev => prev.filter(item => item.id !== id));
    toast.success("화이트리스트에서 제거되었습니다.");
  };

  // 병원 차단 해제
  const handleUnblockHospital = (id: string) => {
    setBlockedHospitals(prev => prev.filter(item => item.id !== id));
    toast.success("차단이 해제되었습니다.");
  };

  // 모델 승인/거부
  const handleApproveModel = (id: string) => {
    setUploadedModels(prev =>
      prev.map(model => model.id === id ? { ...model, status: "approved" as const } : model)
    );
    toast.success("모델이 승인되었습니다.");
  };

  const handleRejectModel = (id: string) => {
    setUploadedModels(prev =>
      prev.map(model => model.id === id ? { ...model, status: "rejected" as const } : model)
    );
    toast.error("모델이 거부되었습니다.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">대기중</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-600 text-green-700">승인됨</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-600 text-red-700">거부됨</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" style={{ color: '#FF9500' }} />
            <h1 style={{ color: '#6B3131' }}>관리자 대시보드</h1>
          </div>
          <p className="text-gray-600">
            HELIOS 시스템 전체를 관리합니다
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="signup" className="gap-2">
              <UserCheck className="w-4 h-4" />
              회원가입 승인
            </TabsTrigger>
            <TabsTrigger value="whitelist" className="gap-2">
              <Mail className="w-4 h-4" />
              화이트리스트
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-2">
              <Ban className="w-4 h-4" />
              차단 병원
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <FileText className="w-4 h-4" />
              모델 관리
            </TabsTrigger>
          </TabsList>

          {/* 회원가입 승인 탭 */}
          <TabsContent value="signup">
            <Card className="p-6 shadow-lg">
              <h2 className="mb-4" style={{ color: '#6B3131' }}>회원가입 신청 목록</h2>
              <p className="text-sm text-gray-600 mb-6">
                병원의 회원가입 신청을 검토하고 승인/거부할 수 있습니다.
              </p>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>병원명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>담당자</TableHead>
                      <TableHead>사업자번호</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signUpRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            {request.hospitalName}
                          </div>
                        </TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.managerName}</TableCell>
                        <TableCell className="font-mono text-sm">{request.businessNumber}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveSignUp(request.id)}
                              >
                                <CheckCircle className="w-3 h-3" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-red-600 text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectSignUp(request.id)}
                              >
                                <XCircle className="w-3 h-3" />
                                거부
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* 화이트리스트 탭 */}
          <TabsContent value="whitelist">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: '#6B3131' }}>이메일 도메인 화이트리스트</h2>
                <Dialog open={isWhitelistDialogOpen} onOpenChange={setIsWhitelistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button style={{ backgroundColor: '#FF9500' }} className="text-white gap-2">
                      <Plus className="w-4 h-4" />
                      추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>화이트리스트 추가</DialogTitle>
                      <DialogDescription>
                        새로운 병원의 이메일 도메인을 화이트리스트에 추가합니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="hospital-name">병원명</Label>
                        <Input
                          id="hospital-name"
                          placeholder="예: 서울대학교병원"
                          value={newWhitelist.hospitalName}
                          onChange={(e) => setNewWhitelist(prev => ({ ...prev, hospitalName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-domain">이메일 도메인</Label>
                        <Input
                          id="email-domain"
                          placeholder="예: @snuh.org"
                          value={newWhitelist.emailDomain}
                          onChange={(e) => setNewWhitelist(prev => ({ ...prev, emailDomain: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWhitelistDialogOpen(false)}>
                        취소
                      </Button>
                      <Button 
                        style={{ backgroundColor: '#FF9500' }} 
                        className="text-white"
                        onClick={handleAddWhitelist}
                      >
                        추가
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                회원가입 시 허용되는 병원 이메일 도메인을 관리합니다.
              </p>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>병원명</TableHead>
                      <TableHead>이메일 도메인</TableHead>
                      <TableHead>추가일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelists.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            {item.hospitalName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.emailDomain}</TableCell>
                        <TableCell>{item.addedDate}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-red-600 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                삭제
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {item.hospitalName}의 화이트리스트 항목이 삭제됩니다. 
                                  이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWhitelist(item.id)}
                                  style={{ backgroundColor: '#d4183d' }}
                                  className="text-white"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* 차단 병원 탭 */}
          <TabsContent value="blocked">
            <Card className="p-6 shadow-lg">
              <h2 className="mb-4" style={{ color: '#6B3131' }}>차단된 병원</h2>
              <p className="text-sm text-gray-600 mb-6">
                서비스 이용이 차단된 병원 목록입니다.
              </p>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>병원명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>차단 사유</TableHead>
                      <TableHead>차단일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedHospitals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          차단된 병원이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedHospitals.map((hospital) => (
                        <TableRow key={hospital.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Ban className="w-4 h-4 text-red-600" />
                              {hospital.hospitalName}
                            </div>
                          </TableCell>
                          <TableCell>{hospital.email}</TableCell>
                          <TableCell>{hospital.reason}</TableCell>
                          <TableCell>{hospital.blockedDate}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  차단 해제
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>차단을 해제하시겠습니까?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {hospital.hospitalName}의 서비스 이용 차단이 해제됩니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUnblockHospital(hospital.id)}
                                    style={{ backgroundColor: '#FF9500' }}
                                    className="text-white"
                                  >
                                    차단 해제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* 모델 관리 탭 */}
          <TabsContent value="models">
            <Card className="p-6 shadow-lg">
              <h2 className="mb-4" style={{ color: '#6B3131' }}>업로드된 모델 관리</h2>
              <p className="text-sm text-gray-600 mb-6">
                병원에서 업로드한 모델을 검토하고 승인/거부할 수 있습니다.
              </p>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>병원명</TableHead>
                      <TableHead>파일명</TableHead>
                      <TableHead>크기</TableHead>
                      <TableHead>업로드일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>버전</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            {model.hospitalName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{model.fileName}</TableCell>
                        <TableCell>{model.fileSize}</TableCell>
                        <TableCell>{model.uploadDate}</TableCell>
                        <TableCell>{getStatusBadge(model.status)}</TableCell>
                        <TableCell>
                          {model.version ? (
                            <Badge variant="outline">{model.version}</Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {model.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveModel(model.id)}
                              >
                                <CheckCircle className="w-3 h-3" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-red-600 text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectModel(model.id)}
                              >
                                <XCircle className="w-3 h-3" />
                                거부
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
