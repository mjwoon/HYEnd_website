package com.hyend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.*;
import com.hyend.exception.BusinessException;
import com.hyend.exception.GlobalExceptionHandler;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MeetingRoomService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MeetingControllerTest {

    @Mock
    private MeetingRoomService meetingRoomService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MeetingController controller = new MeetingController(meetingRoomService);
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
    void createMeeting_returns201() throws Exception {
        MeetingRoomRequest request = new MeetingRoomRequest("테스트 회의", "설명");
        MeetingRoomResponse response = new MeetingRoomResponse(
                1L, "테스트 회의", "설명", 1L, "홍길동",
                "WAITING", "room-uuid", LocalDateTime.now(), null);
        given(meetingRoomService.create(any(), anyLong())).willReturn(response);

        mockMvc.perform(post("/api/meetings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("테스트 회의"));
    }

    @Test
    void createMeeting_returns400_whenTitleBlank() throws Exception {
        MeetingRoomRequest request = new MeetingRoomRequest("", "설명");

        mockMvc.perform(post("/api/meetings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMeetings_returnsListWithSuccess() throws Exception {
        given(meetingRoomService.getList()).willReturn(List.of());

        mockMvc.perform(get("/api/meetings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getMeeting_returns404_whenNotFound() throws Exception {
        given(meetingRoomService.getDetail(anyLong()))
                .willThrow(new BusinessException(ErrorCode.MEETING_NOT_FOUND));

        mockMvc.perform(get("/api/meetings/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void joinMeeting_returnsLiveKitToken() throws Exception {
        given(meetingRoomService.join(anyLong(), anyLong()))
                .willReturn(new JoinMeetingResponse("livekit.jwt.token", "room-uuid", 1L));

        mockMvc.perform(post("/api/meetings/1/join"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.livekitToken").value("livekit.jwt.token"));
    }

    @Test
    void leaveMeeting_returns200() throws Exception {
        mockMvc.perform(post("/api/meetings/1/leave"))
                .andExpect(status().isOk());
        verify(meetingRoomService).leave(1L, 1L);
    }

    @Test
    void endMeeting_returns403_whenNotHost() throws Exception {
        willThrow(new BusinessException(ErrorCode.NOT_MEETING_HOST))
                .given(meetingRoomService).end(anyLong(), anyLong());

        mockMvc.perform(post("/api/meetings/1/end"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteMeeting_returns204() throws Exception {
        mockMvc.perform(delete("/api/meetings/1"))
                .andExpect(status().isNoContent());
        verify(meetingRoomService).delete(1L, 1L);
    }
}
