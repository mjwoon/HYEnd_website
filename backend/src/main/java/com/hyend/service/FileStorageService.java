package com.hyend.service;

import com.hyend.dto.file.FileResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface FileStorageService {
    FileResponse store(MultipartFile file);
    void delete(String storedFilename);

    /**
     * 로컬 저장소에서 파일을 Resource로 반환한다.
     * S3 등 외부 저장소는 파일 URL로 직접 접근하므로 Optional.empty()를 반환한다.
     */
    Optional<Resource> loadAsResource(String filename);
}
