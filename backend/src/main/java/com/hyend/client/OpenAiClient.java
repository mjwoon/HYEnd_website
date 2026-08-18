package com.hyend.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAiClient {

    private final RestClient restClient;
    private final String whisperModel;
    private final String gptModel;

    public OpenAiClient(
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.whisper-model}") String whisperModel,
            @Value("${openai.gpt-model}") String gptModel) {
        this.whisperModel = whisperModel;
        this.gptModel = gptModel;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public String transcribe(byte[] audioBytes, String filename) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new NamedByteArrayResource(audioBytes, filename));
        body.add("model", whisperModel);
        body.add("language", "ko");

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(Map.class);

        return response != null ? (String) response.get("text") : "";
    }

    public String summarize(String transcript) {
        String systemPrompt = """
                당신은 회의록 작성 전문가입니다. 아래 회의 전사 내용을 바탕으로 한국어로 구조화된 회의록을 작성하세요.
                다음 형식을 따르세요:
                ## 회의 요약
                ## 주요 논의 사항
                ## 결정 사항
                ## 후속 조치 (담당자 및 기한 포함)
                """;

        Map<String, Object> requestBody = Map.of(
                "model", gptModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", "전사 내용:\n" + transcript)
                ),
                "max_tokens", 2000
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null) return "";
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) return "";
        @SuppressWarnings("unchecked")
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    // rough token estimate: Korean text ~3 chars per token
    public long estimateTokens(String text) {
        return text.length() / 3L;
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
