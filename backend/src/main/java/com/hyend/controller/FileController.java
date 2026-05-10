package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.config.FileStorageConfig;
import com.hyend.dto.file.FileResponse;
import com.hyend.exception.BusinessException;
import com.hyend.common.ErrorCode;
import com.hyend.security.UserPrincipal;
import com.hyend.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Tag(name = "Files", description = "파일 업로드 API")
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileStorageConfig fileStorageConfig;

    @Operation(summary = "파일 업로드")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<FileResponse>> upload(
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        int max = fileStorageConfig.getMaxFileCount();
        if (files.size() > max) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED,
                    "최대 " + max + "개의 파일만 업로드할 수 있습니다.");
        }

        List<FileResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(fileStorageService.store(file));
        }
        return ApiResponse.ok("파일이 업로드되었습니다.", results);
    }

    @Operation(summary = "파일 다운로드 (로컬 저장소 전용)")
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> download(@PathVariable String filename) {
        if (filename.contains("..") || filename.contains("/")) {
            return ResponseEntity.badRequest().build();
        }
        return fileStorageService.loadAsResource(filename)
                .map(resource -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource))
                .orElse(ResponseEntity.notFound().build());
    }
}
