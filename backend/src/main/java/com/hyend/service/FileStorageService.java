package com.hyend.service;

import com.hyend.dto.file.FileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    FileResponse store(MultipartFile file);
    void delete(String storedFilename);
}
