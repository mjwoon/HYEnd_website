package com.hyend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@ConfigurationProperties(prefix = "file")
@Getter
@Setter
public class FileStorageConfig {

    private Storage storage = new Storage();
    private String allowedExtensions = "jpg,jpeg,png,gif,pdf,docx,xlsx,pptx,hwp,zip";
    private int maxFileCount = 5;

    @Getter
    @Setter
    public static class Storage {
        private String type = "local";
        private Local local = new Local();
        private S3 s3 = new S3();

        @Getter
        @Setter
        public static class Local {
            private String uploadDir = "./uploads";
        }

        @Getter
        @Setter
        public static class S3 {
            private String bucket = "";
            private String region = "ap-northeast-2";
        }
    }

    public Set<String> getAllowedExtensionSet() {
        return Arrays.stream(allowedExtensions.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());
    }
}
