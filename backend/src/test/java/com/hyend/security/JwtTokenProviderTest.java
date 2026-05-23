package com.hyend.security;

import com.hyend.common.ErrorCode;
import com.hyend.exception.BusinessException;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // 256-bit 이상, Base64 인코딩된 시크릿 키
    private final String testSecret = "tH+X6NUS6EhvGFGIjtYiTwPNi31+6NtEl9BYe8jqWwk=";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(testSecret);
    }

    @Test
    @DisplayName("Access Token 생성 및 파싱이 정상적으로 이루어진다.")
    void createAndParseAccessToken() {
        // given
        Long userId = 1L;
        String email = "test@example.com";
        String role = "STUDENT";

        // when
        String token = jwtTokenProvider.createAccessToken(userId, email, role);
        Claims claims = jwtTokenProvider.parseClaims(token);

        // then
        assertThat(token).isNotBlank();
        assertThat(claims.getSubject()).isEqualTo("1");
        assertThat(claims.get("email")).isEqualTo(email);
        assertThat(claims.get("role")).isEqualTo(role);
        assertThat(jwtTokenProvider.getUserId(token)).isEqualTo(1L);
    }

    @Test
    @DisplayName("Refresh Token 생성 및 파싱이 정상적으로 이루어진다.")
    void createAndParseRefreshToken() {
        // given
        Long userId = 2L;
        String email = "admin@example.com";
        String role = "ADMIN";

        // when
        String token = jwtTokenProvider.createRefreshToken(userId, email, role);
        Claims claims = jwtTokenProvider.parseClaims(token);

        // then
        assertThat(token).isNotBlank();
        assertThat(claims.getSubject()).isEqualTo("2");
        assertThat(claims.get("email")).isEqualTo(email);
        assertThat(claims.get("role")).isEqualTo(role);
    }

    @Test
    @DisplayName("유효한 토큰은 validate 호출 시 true를 반환한다.")
    void validateToken_Valid() {
        // given
        String token = jwtTokenProvider.createAccessToken(1L, "test@example.com", "STUDENT");

        // when
        boolean isValid = jwtTokenProvider.validate(token);

        // then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("형식이 잘못되거나 변조된 토큰은 parseClaims 호출 시 예외를 발생시킨다.")
    void validateToken_Invalid() {
        // given
        String token = jwtTokenProvider.createAccessToken(1L, "test@example.com", "STUDENT");
        String invalidToken = token + "invalid";

        // when & then
        assertThatThrownBy(() -> jwtTokenProvider.parseClaims(invalidToken))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.INVALID_TOKEN.getMessage());
        
        assertThat(jwtTokenProvider.validate(invalidToken)).isFalse();
    }

    @Test
    @DisplayName("완전히 잘못된 형식의 문자열도 예외를 발생시킨다.")
    void validateToken_Malformed() {
        // given
        String malformedToken = "this.is.not_a_jwt_token";

        // when & then
        assertThatThrownBy(() -> jwtTokenProvider.parseClaims(malformedToken))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.INVALID_TOKEN.getMessage());
    }
}
