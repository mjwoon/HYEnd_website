package com.hyend.service.impl;

import com.hyend.common.ErrorCode;
import com.hyend.common.FileValidationUtil;
import com.hyend.config.FileStorageConfig;
import com.hyend.dto.file.FileResponse;
import com.hyend.exception.BusinessException;
import com.hyend.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private final FileStorageConfig config;
    private Path uploadPath;

    @PostConstruct
    public void init() {
        uploadPath = Paths.get(config.getStorage().getLocal().getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new IllegalStateException("업로드 디렉토리 생성 실패: " + uploadPath, e);
        }
    }

    @Override
    public FileResponse store(MultipartFile file) {
        FileValidationUtil.validate(file, config.getAllowedExtensionSet());

        String storedFilename = FileValidationUtil.generateStoredFilename(file.getOriginalFilename());
        Path targetPath = uploadPath.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return new FileResponse(
                file.getOriginalFilename(),
                storedFilename,
                "/api/files/" + storedFilename,
                file.getSize(),
                file.getContentType()
        );
    }

    @Override
    public void delete(String storedFilename) {
        Path filePath = uploadPath.resolve(storedFilename).normalize();
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_DELETE_FAILED);
        }
    }

    @Override
    public Optional<Resource> loadAsResource(String storedFilename) {
        Path filePath = uploadPath.resolve(storedFilename).normalize();
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return Optional.of(resource);
            }
        } catch (MalformedURLException ignored) {}
        throw new BusinessException(ErrorCode.ATTACHMENT_NOT_FOUND);
    }
}
