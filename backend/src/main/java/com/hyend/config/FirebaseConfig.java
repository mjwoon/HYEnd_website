package com.hyend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials-path}")
    private String credentialsPath;

    @PostConstruct
    public void initFirebase() {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.info("Firebase credentials not configured — push notifications disabled");
            return;
        }
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return;
            }
            FileInputStream serviceAccount = new FileInputStream(credentialsPath);
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase 초기화 완료");
        } catch (Exception e) {
            log.warn("Firebase 초기화 실패 — push notifications disabled: {}", e.getMessage());
        }
    }
}
