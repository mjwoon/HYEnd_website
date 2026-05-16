package com.hyend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("유효한 토큰이 헤더에 있으면 인증 객체가 SecurityContext에 저장된다.")
    void doFilterInternal_ValidToken() throws ServletException, IOException {
        // given
        String token = "valid_token";
        request.addHeader("Authorization", "Bearer " + token);

        Long userId = 1L;
        UserDetails mockUserDetails = mock(UserDetails.class);

        given(jwtTokenProvider.validate(token)).willReturn(true);
        given(jwtTokenProvider.getUserId(token)).willReturn(userId);
        given(customUserDetailsService.loadUserById(userId)).willReturn(mockUserDetails);

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isEqualTo(mockUserDetails);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("토큰이 유효하지 않으면 인증 객체가 저장되지 않는다.")
    void doFilterInternal_InvalidToken() throws ServletException, IOException {
        // given
        String token = "invalid_token";
        request.addHeader("Authorization", "Bearer " + token);

        given(jwtTokenProvider.validate(token)).willReturn(false);

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Authorization 헤더가 없거나 Bearer로 시작하지 않으면 패스한다.")
    void doFilterInternal_NoToken() throws ServletException, IOException {
        // given
        request.addHeader("Authorization", "Basic something");

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
