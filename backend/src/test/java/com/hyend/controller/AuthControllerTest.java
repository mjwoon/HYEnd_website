package com.hyend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hyend.common.ErrorCode;
import com.hyend.dto.auth.*;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.exception.GlobalExceptionHandler;
import com.hyend.security.UserPrincipal;
import com.hyend.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock AuthService authService;

    MockMvc mockMvc;
    final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController(authService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── register ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register - 201 Created")
    void register_success() throws Exception {
        RegisterRequest req = new RegisterRequest("user@test.com", "password1", "홍길동", null, null);
        willDoNothing().given(authService).register(any());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("회원가입이 완료되었습니다."));
    }

    @Test
    @DisplayName("POST /api/auth/register - 400 유효성 오류 (이메일 형식/비밀번호 길이/이름 공백)")
    void register_validationFail() throws Exception {
        RegisterRequest req = new RegisterRequest("not-email", "short", "", null, null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("POST /api/auth/register - 409 중복 이메일")
    void register_duplicateEmail() throws Exception {
        RegisterRequest req = new RegisterRequest("dup@test.com", "password1", "홍길동", null, null);
        willThrow(new BusinessException(ErrorCode.DUPLICATE_EMAIL)).given(authService).register(any());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    // ─── login ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login - 200 OK")
    void login_success() throws Exception {
        LoginRequest req = new LoginRequest("user@test.com", "password1");
        TokenResponse token = TokenResponse.of("access-token", "refresh-token", 15 * 60 * 1000L);
        given(authService.login(any())).willReturn(token);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresIn").value(900));
    }

    @Test
    @DisplayName("POST /api/auth/login - 401 잘못된 자격증명")
    void login_badCredentials() throws Exception {
        LoginRequest req = new LoginRequest("user@test.com", "wrong");
        given(authService.login(any())).willThrow(new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // ─── refresh ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/refresh - 200 OK")
    void refresh_success() throws Exception {
        RefreshRequest req = new RefreshRequest("valid-refresh");
        TokenResponse token = TokenResponse.of("new-access", "new-refresh", 15 * 60 * 1000L);
        given(authService.refresh(any())).willReturn(token);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("new-access"));
    }

    // ─── logout ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/logout - 200 OK (인증된 사용자)")
    void logout_success() throws Exception {
        UserPrincipal principal = mock(UserPrincipal.class);
        given(principal.getId()).willReturn(1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("로그아웃 되었습니다."));

        then(authService).should().logout(1L);
    }
}
