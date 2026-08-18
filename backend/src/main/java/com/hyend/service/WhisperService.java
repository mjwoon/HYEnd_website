package com.hyend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@Slf4j
public class WhisperService {

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.whisper-model:whisper-1}")
    private String model;

    private final RestClient restClient = RestClient.create();

    public String transcribe(MultipartFile audio) {
        if (apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY가 설정되지 않아 전사를 건너뜁니다.");
            return "";
        }

        try {
            byte[] bytes = audio.getBytes();
            String filename = audio.getOriginalFilename() != null
                    ? audio.getOriginalFilename() : "audio.webm";

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(bytes) {
                @Override public String getFilename() { return filename; }
            });
            body.add("model", model);
            body.add("language", "ko");
            body.add("response_format", "json");

            @SuppressWarnings("unchecked")
            Map<String, String> response = restClient.post()
                    .uri("https://api.openai.com/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            return response != null ? response.getOrDefault("text", "") : "";
        } catch (Exception e) {
            log.error("Whisper 전사 실패: {}", e.getMessage());
            return "";
        }
    }
}
