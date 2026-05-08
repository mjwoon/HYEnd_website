package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.auth.*;
import com.hyend.entity.RefreshToken;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.RefreshTokenRepository;
import com.hyend.repository.UserRepository;
import com.hyend.security.JwtTokenProvider;
import com.hyend.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock AuthenticationManager authenticationManager;
    @InjectMocks AuthService authService;

    // ─── register ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("회원가입 - 성공")
    void register_success() {
        RegisterRequest req = new RegisterRequest("new@test.com", "password1", "홍길동", null, null);
        given(userRepository.existsByEmail(req.email())).willReturn(false);
        given(passwordEncoder.encode(req.password())).willReturn("encoded");

        assertThatCode(() -> authService.register(req)).doesNotThrowAnyException();
        then(userRepository).should().save(any(User.class));
    }

    @Test
    @DisplayName("회원가입 - 중복 이메일")
    void register_duplicateEmail() {
        RegisterRequest req = new RegisterRequest("dup@test.com", "password1", "홍길동", null, null);
        given(userRepository.existsByEmail(req.email())).willReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.DUPLICATE_EMAIL));
        then(userRepository).should(never()).save(any());
    }

    // ─── login ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("로그인 - 성공")
    void login_success() {
        LoginRequest req = new LoginRequest("test@test.com", "password1");

        UserPrincipal principal = mock(UserPrincipal.class);
        given(principal.getId()).willReturn(1L);
        given(principal.getEmail()).willReturn("test@test.com");
        given(principal.getRole()).willReturn(User.Role.STUDENT);

        given(authenticationManager.authenticate(any()))
                .willReturn(new UsernamePasswordAuthenticationToken(principal, null));
        given(jwtTokenProvider.createAccessToken(1L, "test@test.com", "STUDENT")).willReturn("access-token");
        given(jwtTokenProvider.createRefreshToken(1L, "test@test.com", "STUDENT")).willReturn("refresh-token");
        given(jwtTokenProvider.getRefreshTokenExpiryMs()).willReturn(7 * 24 * 60 * 60 * 1000L);
        given(userRepository.getReferenceById(1L))
                .willReturn(User.of("test@test.com", "encoded", "홍길동", User.Role.STUDENT));

        TokenResponse result = authService.login(req);

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.refreshToken()).isEqualTo("refresh-token");
        assertThat(result.tokenType()).isEqualTo("Bearer");
        assertThat(result.expiresIn()).isEqualTo(900L); // 15분 = 900초
    }

    @Test
    @DisplayName("로그인 - 잘못된 자격증명")
    void login_badCredentials() {
        LoginRequest req = new LoginRequest("test@test.com", "wrong");
        given(authenticationManager.authenticate(any()))
                .willThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
    }

    // ─── refresh ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("토큰 재발급 - 리프레시 토큰 없음")
    void refresh_tokenNotFound() {
        given(refreshTokenRepository.findByToken("no-such-token")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("no-such-token")))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
    }

    @Test
    @DisplayName("토큰 재발급 - 만료된 리프레시 토큰")
    void refresh_expiredToken() {
        RefreshToken stored = mock(RefreshToken.class);
        given(stored.getExpiresAt()).willReturn(LocalDateTime.now().minusSeconds(1));
        given(refreshTokenRepository.findByToken("expired")).willReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("expired")))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.EXPIRED_TOKEN));
        then(refreshTokenRepository).should().delete(stored);
    }

    @Test
    @DisplayName("토큰 재발급 - 성공")
    void refresh_success() {
        User user = mock(User.class);
        given(user.getId()).willReturn(1L);
        given(user.getEmail()).willReturn("test@test.com");
        given(user.getRole()).willReturn(User.Role.STUDENT);

        RefreshToken stored = mock(RefreshToken.class);
        given(stored.getExpiresAt()).willReturn(LocalDateTime.now().plusDays(1));
        given(stored.getUser()).willReturn(user);
        given(refreshTokenRepository.findByToken("valid-refresh")).willReturn(Optional.of(stored));

        given(jwtTokenProvider.createAccessToken(1L, "test@test.com", "STUDENT")).willReturn("new-access");
        given(jwtTokenProvider.createRefreshToken(1L, "test@test.com", "STUDENT")).willReturn("new-refresh");
        given(jwtTokenProvider.getRefreshTokenExpiryMs()).willReturn(7 * 24 * 60 * 60 * 1000L);
        given(userRepository.getReferenceById(1L)).willReturn(user);

        TokenResponse result = authService.refresh(new RefreshRequest("valid-refresh"));

        assertThat(result.accessToken()).isEqualTo("new-access");
        assertThat(result.refreshToken()).isEqualTo("new-refresh");
        then(refreshTokenRepository).should().delete(stored);
    }

    // ─── logout ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("로그아웃 - 성공")
    void logout_success() {
        assertThatCode(() -> authService.logout(1L)).doesNotThrowAnyException();
        then(refreshTokenRepository).should().deleteByUserId(1L);
    }
}
