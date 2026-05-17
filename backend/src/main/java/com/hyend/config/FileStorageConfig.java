package com.hyend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

// TODO [H-4] 파일 저장소 설정 구현
@Configuration
public class FileStorageConfig {
    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() {

        try {
            Path path = Paths.get(uploadDir);

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }

            System.out.println("파일 저장 경로 생성 완료 : " + path.toAbsolutePath());

        } catch (IOException e) {
            throw new RuntimeException("파일 저장 폴더 생성 실패", e);
        }
    }
}
