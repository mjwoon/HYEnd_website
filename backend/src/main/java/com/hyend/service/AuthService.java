package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.auth.LoginRequest;
import com.hyend.dto.auth.RefreshRequest;
import com.hyend.dto.auth.RegisterRequest;
import com.hyend.dto.auth.TokenResponse;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.RefreshTokenRepository;

import java.util.Optional;
import com.hyend.repository.UserRepository;
import com.hyend.security.JwtTokenProvider;
import com.hyend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        User user = User.of(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name(),
                User.Role.STUDENT
        );
        userRepository.save(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return issueTokens(principal.getId(), principal.getEmail(), principal.getRole().name());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();

        // 1. Grace Period 캐시 확인
        Optional<TokenResponse> cachedResponse = refreshTokenRepository.findGracePeriod(token);
        if (cachedResponse.isPresent()) {
            return cachedResponse.get();
        }

        // 2. JWT 토큰 검증 (만료 여부 등 검증, 만료 시 EXPIRED_TOKEN 예외 자동 발생)
        jwtTokenProvider.parseClaims(token);

        // 3. Redis에서 원래 토큰 조회
        Long userId = refreshTokenRepository.findUserIdByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        // 4. 사용자 정보 조회 및 토큰 재발급
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 기존 토큰 삭제 및 신규 토큰 발급
        refreshTokenRepository.delete(token);
        TokenResponse newTokens = issueTokens(user.getId(), user.getEmail(), user.getRole().name());

        // 5. Grace Period 캐시 저장 (10초)
        refreshTokenRepository.saveGracePeriod(token, newTokens, 10000L);

        return newTokens;
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private TokenResponse issueTokens(Long userId, String email, String role) {
        String accessToken = jwtTokenProvider.createAccessToken(userId, email, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId, email, role);

        long expiryMs = jwtTokenProvider.getRefreshTokenExpiryMs();

        // Redis에 새 토큰 저장
        refreshTokenRepository.save(refreshToken, userId, expiryMs);

        return TokenResponse.of(accessToken, refreshToken, jwtTokenProvider.getAccessTokenExpiryMs());
    }
}
