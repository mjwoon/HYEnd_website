package com.hyend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.hyend.common.ErrorCode;
import com.hyend.entity.MeetingParticipant;
import com.hyend.entity.UserFcmToken;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingParticipantRepository;
import com.hyend.repository.UserFcmTokenRepository;
import com.hyend.repository.UserRepository;
import com.hyend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final UserFcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;
    private final MeetingParticipantRepository participantRepository;

    @Transactional
    public void registerToken(Long userId, String token, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        fcmTokenRepository.findByToken(token).ifPresentOrElse(
                existing -> existing.refreshLastUsed(),
                () -> fcmTokenRepository.save(UserFcmToken.of(user, token, userAgent))
        );
    }

    @Transactional
    public void removeToken(Long userId, String token) {
        fcmTokenRepository.deleteByUserIdAndToken(userId, token);
    }

    @Async("aiTaskExecutor")
    public void notifyChat(Long roomId, String senderName, String content) {
        if (!isFirebaseEnabled()) return;

        String title = senderName + "님의 메시지";
        String body = content.length() > 100 ? content.substring(0, 100) + "..." : content;

        // 현재 방에 참가 중인 유저들의 FCM 토큰에 푸시
        participantRepository.findByRoomIdAndLeftAtIsNull(roomId).stream()
                .map(MeetingParticipant::getUser)
                .map(User::getId)
                .flatMap(uid -> fcmTokenRepository.findByUserId(uid).stream())
                .forEach(fcmToken -> sendPush(fcmToken.getToken(), title, body));
    }

    private void sendPush(String token, String title, String body) {
        try {
            Message message = Message.builder()
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .setToken(token)
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (Exception e) {
            log.warn("FCM 전송 실패 (token={}...): {}", token.substring(0, Math.min(token.length(), 10)), e.getMessage());
        }
    }

    private boolean isFirebaseEnabled() {
        try {
            return !FirebaseApp.getApps().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
