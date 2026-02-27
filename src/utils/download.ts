// src/utils/download.ts

export const downloadModelFiles = (modelName: string) => {
  const basePath = "/models/chexpert_tfjs";
  
  // ✅ [수정] 실제 폴더에 있는 모든 파일을 리스트에 적어야 합니다.
  const files = [
    { name: 'model.json', url: `${basePath}/model.json` },
    { name: 'group1-shard1of7.bin', url: `${basePath}/group1-shard1of7.bin` },
    { name: 'group1-shard2of7.bin', url: `${basePath}/group1-shard2of7.bin` },
    { name: 'group1-shard3of7.bin', url: `${basePath}/group1-shard3of7.bin` },
    { name: 'group1-shard4of7.bin', url: `${basePath}/group1-shard4of7.bin` },
    { name: 'group1-shard5of7.bin', url: `${basePath}/group1-shard5of7.bin` },
    { name: 'group1-shard6of7.bin', url: `${basePath}/group1-shard6of7.bin` },
    { name: 'group1-shard7of7.bin', url: `${basePath}/group1-shard7of7.bin` }
  ];

  alert(`모델 다운로드를 시작합니다.\n총 ${files.length}개의 파일이 다운로드됩니다.\n(팝업 차단이 되어있다면 해제해주세요)`);

  files.forEach((file, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, index * 300); // 0.3초 간격으로 다운로드
  });
};