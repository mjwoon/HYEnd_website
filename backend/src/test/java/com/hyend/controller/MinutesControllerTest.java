package com.hyend.controller;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.exception.BusinessException;
import com.hyend.exception.GlobalExceptionHandler;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MinutesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MinutesControllerTest {

    @Mock private MinutesService minutesService;

    private MockMvc mockMvc;

    private static final MinutesResponse MINUTES_RESPONSE =
            new MinutesResponse(10L, "{\"summary\":\"회의 요약\"}", LocalDateTime.now());

    @BeforeEach
    void setUp() {
        MinutesController controller = new MinutesController(minutesService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

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
    void generateMinutes_returns200() throws Exception {
        given(minutesService.generate(10L, 1L)).willReturn(MINUTES_RESPONSE);

        mockMvc.perform(post("/api/meetings/10/minutes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("{\"summary\":\"회의 요약\"}"));
    }

    @Test
    void generateMinutes_returns403WhenNotHost() throws Exception {
        given(minutesService.generate(10L, 1L))
                .willThrow(new BusinessException(ErrorCode.NOT_MEETING_HOST));

        mockMvc.perform(post("/api/meetings/10/minutes"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMinutes_returns200() throws Exception {
        given(minutesService.getMinutes(10L)).willReturn(MINUTES_RESPONSE);

        mockMvc.perform(get("/api/meetings/10/minutes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roomId").value(10));
    }

    @Test
    void getMinutes_returns404WhenNotFound() throws Exception {
        given(minutesService.getMinutes(99L))
                .willThrow(new BusinessException(ErrorCode.MINUTES_NOT_FOUND));

        mockMvc.perform(get("/api/meetings/99/minutes"))
                .andExpect(status().isNotFound());
    }
}
