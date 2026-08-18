package com.hyend.service.impl;

import com.hyend.common.ErrorCode;
import com.hyend.common.FileValidationUtil;
import com.hyend.config.FileStorageConfig;
import com.hyend.dto.file.FileResponse;
import com.hyend.exception.BusinessException;
import com.hyend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.Optional;

@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "s3")
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final FileStorageConfig config;

    @Override
    public FileResponse store(MultipartFile file) {
        FileValidationUtil.validate(file, config.getAllowedExtensionSet());

        String storedFilename = FileValidationUtil.generateStoredFilename(file.getOriginalFilename());
        String bucket = config.getStorage().getS3().getBucket();
        String region = config.getStorage().getS3().getRegion();

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(storedFilename)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        try {
            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        String fileUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + storedFilename;

        return new FileResponse(
                file.getOriginalFilename(),
                storedFilename,
                fileUrl,
                file.getSize(),
                file.getContentType()
        );
    }

    @Override
    public Optional<Resource> loadAsResource(String storedFilename) {
        return Optional.empty();
    }

    @Override
    public void delete(String storedFilename) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(config.getStorage().getS3().getBucket())
                .key(storedFilename)
                .build();
        try {
            s3Client.deleteObject(deleteRequest);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.FILE_DELETE_FAILED);
        }
    }
}
