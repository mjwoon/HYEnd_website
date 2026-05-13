package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.auth.LoginRequest;
import com.hyend.dto.auth.RefreshRequest;
import com.hyend.dto.auth.RegisterRequest;
import com.hyend.dto.auth.TokenResponse;
import com.hyend.entity.RefreshToken;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.RefreshTokenRepository;
import com.hyend.repository.UserRepository;
import com.hyend.security.JwtTokenProvider;
import com.hyend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
        } catch (BadCredentialsException e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return issueTokens(principal.getId(), principal.getEmail(), principal.getRole().name());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new BusinessException(ErrorCode.EXPIRED_TOKEN);
        }

        User user = stored.getUser();
        refreshTokenRepository.delete(stored);
        return issueTokens(user.getId(), user.getEmail(), user.getRole().name());
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private TokenResponse issueTokens(Long userId, String email, String role) {
        String accessToken = jwtTokenProvider.createAccessToken(userId, email, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId, email, role);

        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshTokenExpiryMs() / 1000);

        User user = userRepository.getReferenceById(userId);
        refreshTokenRepository.save(RefreshToken.of(user, refreshToken, expiresAt));

        return TokenResponse.of(accessToken, refreshToken, 15 * 60 * 1000L);
    }
}
