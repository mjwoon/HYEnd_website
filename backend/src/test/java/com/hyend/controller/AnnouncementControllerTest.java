package com.hyend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hyend.common.PageResponse;
import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.dto.announcement.AnnouncementSummary;
import com.hyend.exception.GlobalExceptionHandler;
import com.hyend.security.UserPrincipal;
import com.hyend.service.AnnouncementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private AnnouncementService announcementService;

    @BeforeEach
    void setUp() {
        AnnouncementController controller = new AnnouncementController(announcementService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalArgumentResolver()
                )
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("공지사항 목록 조회 API 호출 시 페이지 응답을 반환한다.")
    void getList() throws Exception {
        // given
        AnnouncementSummary summary = new AnnouncementSummary(
                1L, "Test Title", LocalDateTime.now(), LocalDateTime.now()
        );
        Page<AnnouncementSummary> page = new PageImpl<>(List.of(summary), PageRequest.of(0, 10), 1);
        given(announcementService.getList(any())).willReturn(page);

        // when & then
        mockMvc.perform(get("/api/announcements")
                        .param("page", "0")
                        .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Test Title"));
    }

    @Test
    @DisplayName("공지사항 상세 조회 API 호출 시 상세 정보를 반환한다.")
    void getDetail() throws Exception {
        // given
        AnnouncementResponse response = new AnnouncementResponse(
                1L, "Test Title", "Content", "GENERAL", "Admin", false, 0, LocalDateTime.now(), LocalDateTime.now()
        );
        given(announcementService.getDetail(1L)).willReturn(response);

        // when & then
        mockMvc.perform(get("/api/announcements/1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Title"))
                .andExpect(jsonPath("$.data.content").value("Content"));
    }

    @Test
    @DisplayName("공지사항 작성 API 호출 시 201 상태와 생성된 정보를 반환한다.")
    void create() throws Exception {
        // given
        UserPrincipal principal = mock(UserPrincipal.class);
        given(principal.getId()).willReturn(1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));

        AnnouncementRequest request = new AnnouncementRequest("New Title", "New Content", "GENERAL", false);
        AnnouncementResponse response = new AnnouncementResponse(
                1L, "New Title", "New Content", "GENERAL", "Admin", false, 0, LocalDateTime.now(), LocalDateTime.now()
        );
        
        given(announcementService.create(any(AnnouncementRequest.class), any())).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Title"));
    }

    @Test
    @DisplayName("공지사항 삭제 API 호출 시 성공 메시지를 반환한다.")
    void deleteAnnouncement() throws Exception {
        // when & then
        mockMvc.perform(delete("/api/announcements/1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("공지사항이 삭제되었습니다."));

        verify(announcementService).delete(1L);
    }
}
