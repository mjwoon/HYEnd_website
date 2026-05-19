package com.hyend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@ConditionalOnProperty(name = "file.storage.type", havingValue = "s3")
@RequiredArgsConstructor
public class S3Config {

    private final FileStorageConfig fileStorageConfig;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(fileStorageConfig.getStorage().getS3().getRegion()))
                .build();
    }
}
