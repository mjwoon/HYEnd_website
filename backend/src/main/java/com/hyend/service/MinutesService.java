package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.entity.MeetingMinutes;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingTranscript;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingMinutesRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.MeetingTranscriptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinutesService {

    private final GptService gptService;
    private final MeetingRoomRepository roomRepository;
    private final MeetingTranscriptRepository transcriptRepository;
    private final MeetingMinutesRepository minutesRepository;

    private static final String SYSTEM_PROMPT = """
            당신은 회의록 작성 전문가입니다. 주어진 회의 전사 텍스트를 분석하여 구조화된 회의록을 JSON 형식으로 작성하세요.
            반드시 아래 JSON 스키마를 따르세요:
            {
              "generatedAt": "ISO 8601 datetime string",
              "summary": {
                "datetime": "회의 일시 (YYYY-MM-DD HH:mm)",
                "attendees": "참석자 목록",
                "agenda": "주요 안건 요약"
              },
              "discussions": ["주요 논의 내용 항목들"],
              "decisions": ["결정된 사항들"],
              "actionItems": [
                { "assignee": "담당자", "task": "할 일", "deadline": "기한 (없으면 빈 문자열)", "done": false }
              ]
            }
            전사 내용이 없거나 불충분한 경우에도 최선을 다해 작성하세요.
            """;

    @Transactional
    public MinutesResponse generate(Long roomId, Long userId) {
        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);

        List<MeetingTranscript> transcripts = transcriptRepository.findByRoomIdOrderByChunkIndex(roomId);

        String transcriptText = transcripts.stream()
                .filter(t -> t.getText() != null && !t.getText().isBlank())
                .map(t -> {
                    String name = t.getSpeaker() != null ? t.getSpeaker().getName() : "알 수 없음";
                    return name + ": " + t.getText();
                })
                .collect(Collectors.joining("\n"));

        String userContent = String.format(
                "회의 제목: %s\n회의 설명: %s\n\n전사 내용:\n%s",
                room.getTitle(),
                room.getDescription() != null ? room.getDescription() : "(없음)",
                transcriptText.isBlank() ? "(전사 내용 없음)" : transcriptText
        );

        String json = gptService.complete(SYSTEM_PROMPT, userContent);

        if (json.isBlank()) {
            json = buildFallbackJson(room);
        } else {
            // validate JSON (simple check)
            String trimmed = json.trim();
            if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
                log.warn("GPT 응답이 유효한 JSON 객체가 아닙니다. fallback 사용.");
                json = buildFallbackJson(room);
            }
        }

        // upsert
        final String finalJson = json;
        MeetingMinutes minutes = minutesRepository.findByRoomId(roomId)
                .map(existing -> {
                    minutesRepository.delete(existing);
                    return MeetingMinutes.builder().room(room).content(finalJson).build();
                })
                .orElse(MeetingMinutes.builder().room(room).content(finalJson).build());

        return MinutesResponse.from(minutesRepository.save(minutes));
    }

    @Transactional(readOnly = true)
    public MinutesResponse getMinutes(Long roomId) {
        return minutesRepository.findByRoomId(roomId)
                .map(MinutesResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.MINUTES_NOT_FOUND));
    }

    private String buildFallbackJson(MeetingRoom room) {
        String datetime = room.getCreatedAt() != null
                ? room.getCreatedAt().toString().replace("T", " ").substring(0, 16)
                : "";
        return """
                {
                  "generatedAt": "%s",
                  "summary": {
                    "datetime": "%s",
                    "attendees": "%s",
                    "agenda": "%s"
                  },
                  "discussions": ["(전사 내용이 없어 자동 생성이 어렵습니다)"],
                  "decisions": [],
                  "actionItems": []
                }
                """.formatted(
                java.time.LocalDateTime.now().toString(),
                datetime,
                room.getHost().getName(),
                room.getDescription() != null ? room.getDescription() : "(안건 없음)"
        );
    }
}
