package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.entity.User;
import com.hyend.entity.UserFcmToken;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingParticipantRepository;
import com.hyend.repository.UserFcmTokenRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationServiceTest {

    @Mock UserFcmTokenRepository fcmTokenRepository;
    @Mock UserRepository userRepository;
    @Mock MeetingParticipantRepository participantRepository;
    @InjectMocks NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("테스터");
    }

    @Test
    void registerToken_savesNewToken() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(fcmTokenRepository.findByToken("token-abc")).thenReturn(Optional.empty());

        notificationService.registerToken(1L, "token-abc", "Chrome/120");

        verify(fcmTokenRepository).save(any(UserFcmToken.class));
    }

    @Test
    void registerToken_refreshesExistingToken() {
        UserFcmToken existing = mock(UserFcmToken.class);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(fcmTokenRepository.findByToken("token-abc")).thenReturn(Optional.of(existing));

        notificationService.registerToken(1L, "token-abc", "Chrome/120");

        verify(existing).refreshLastUsed();
        verify(fcmTokenRepository, never()).save(any());
    }

    @Test
    void registerToken_throwsWhenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.registerToken(99L, "token-abc", "ua"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void removeToken_callsDeleteByUserIdAndToken() {
        notificationService.removeToken(1L, "token-abc");
        verify(fcmTokenRepository).deleteByUserIdAndToken(1L, "token-abc");
    }
}
