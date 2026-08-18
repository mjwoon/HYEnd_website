package com.hyend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.dto.meeting.MinutesUpdateRequest;
import com.hyend.dto.meeting.TranscriptResponse;
import com.hyend.exception.BusinessException;
import com.hyend.exception.GlobalExceptionHandler;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MinutesService;
import com.hyend.service.TranscriptService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MinutesControllerTest {

    @Mock private TranscriptService transcriptService;
    @Mock private MinutesService minutesService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final TranscriptResponse TRANSCRIPT_RESPONSE = new TranscriptResponse(
            1L, 10L, 1L, "테스터", "안녕하세요", 0, LocalDateTime.now());

    private static final MinutesResponse MINUTES_RESPONSE = new MinutesResponse(
            1L, 10L, "## 회의 요약\n내용", false, LocalDateTime.now(), LocalDateTime.now());

    @BeforeEach
    void setUp() {
        MinutesController controller = new MinutesController(transcriptService, minutesService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        UserPrincipal principal = mock(UserPrincipal.class);
        given(principal.getId()).willReturn(1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploadTranscript_returns200WithResponse() throws Exception {
        given(transcriptService.transcribeAsync(eq(10L), eq(1L), any(), eq(0)))
                .willReturn(CompletableFuture.completedFuture(TRANSCRIPT_RESPONSE));

        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[1000]);

        // CompletableFuture 반환 타입은 MockMvc asyncDispatch 패턴으로 검증
        org.springframework.test.web.servlet.MvcResult mvcResult =
                mockMvc.perform(multipart("/api/meetings/10/transcripts")
                                .file(audio)
                                .param("chunkIndex", "0"))
                        .andExpect(request().asyncStarted())
                        .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.text").value("안녕하세요"))
                .andExpect(jsonPath("$.data.chunkIndex").value(0));
    }

    @Test
    void getTranscripts_returnsListResponse() throws Exception {
        given(transcriptService.getTranscripts(10L)).willReturn(List.of(TRANSCRIPT_RESPONSE));

        mockMvc.perform(get("/api/meetings/10/transcripts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].speakerName").value("테스터"));
    }

    @Test
    void generateMinutes_returns200() throws Exception {
        given(minutesService.generate(10L, 1L)).willReturn(MINUTES_RESPONSE);

        mockMvc.perform(post("/api/meetings/10/minutes/generate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isEdited").value(false));
    }

    @Test
    void generateMinutes_returns403WhenNotHost() throws Exception {
        given(minutesService.generate(10L, 1L))
                .willThrow(new BusinessException(ErrorCode.NOT_MEETING_HOST));

        mockMvc.perform(post("/api/meetings/10/minutes/generate"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMinutes_returns200() throws Exception {
        given(minutesService.getMinutes(10L)).willReturn(MINUTES_RESPONSE);

        mockMvc.perform(get("/api/meetings/10/minutes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("## 회의 요약\n내용"));
    }

    @Test
    void getMinutes_returns404WhenNotFound() throws Exception {
        given(minutesService.getMinutes(99L))
                .willThrow(new BusinessException(ErrorCode.MINUTES_NOT_FOUND));

        mockMvc.perform(get("/api/meetings/99/minutes"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateMinutes_returns200WithUpdatedContent() throws Exception {
        MinutesResponse updated = new MinutesResponse(
                1L, 10L, "수정된 내용", true, LocalDateTime.now(), LocalDateTime.now());
        given(minutesService.updateMinutes(10L, 1L, "수정된 내용")).willReturn(updated);

        MinutesUpdateRequest request = new MinutesUpdateRequest("수정된 내용");
        mockMvc.perform(put("/api/meetings/10/minutes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isEdited").value(true))
                .andExpect(jsonPath("$.data.content").value("수정된 내용"));
    }
}
