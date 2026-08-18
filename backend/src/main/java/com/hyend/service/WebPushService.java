package com.hyend.service;

import com.hyend.config.VapidKeyConfig;
import com.hyend.dto.push.PushSubscriptionRequest;
import com.hyend.entity.PushSubscription;
import com.hyend.entity.User;
import com.hyend.repository.PushSubscriptionRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final VapidKeyConfig vapidKeyConfig;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    @Transactional
    public void saveSubscription(Long userId, PushSubscriptionRequest req) {
        pushSubscriptionRepository.findByUserIdAndEndpoint(userId, req.endpoint())
                .ifPresent(pushSubscriptionRepository::delete);

        User user = userRepository.getReferenceById(userId);
        PushSubscription sub = PushSubscription.builder()
                .user(user)
                .endpoint(req.endpoint())
                .p256dh(req.p256dh())
                .auth(req.auth())
                .userAgent(req.userAgent())
                .build();
        pushSubscriptionRepository.save(sub);
    }

    @Transactional
    public void removeSubscription(Long userId, String endpoint) {
        pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
    }

    public void broadcastToAll(String title, String body, String url) {
        List<PushSubscription> all = pushSubscriptionRepository.findAll();
        if (all.isEmpty()) return;
        byte[] payload = buildPayload(title, body, url);
        for (PushSubscription sub : all) {
            try {
                send(sub, payload);
            } catch (Exception e) {
                log.warn("브로드캐스트 푸시 실패 (endpoint={}): {}", sub.getEndpoint(), e.getMessage());
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    pushSubscriptionRepository.delete(sub);
                }
            }
        }
    }

    public void sendToUser(Long userId, String title, String body, String url) {
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(userId);
        if (subs.isEmpty()) return;

        byte[] payload = buildPayload(title, body, url);

        for (PushSubscription sub : subs) {
            try {
                send(sub, payload);
            } catch (Exception e) {
                log.warn("푸시 전송 실패 (endpoint={}): {}", sub.getEndpoint(), e.getMessage());
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    pushSubscriptionRepository.delete(sub);
                }
            }
        }
    }

    private void send(PushSubscription sub, byte[] payload) throws Exception {
        Notification notification = new Notification(
                sub.getEndpoint(),
                sub.getP256dh(),
                sub.getAuth(),
                payload
        );
        PushService pushService = new PushService(
                vapidKeyConfig.getPublicKey(),
                vapidKeyConfig.getPrivateKey(),
                vapidKeyConfig.getSubject()
        );
        HttpResponse response = pushService.send(notification);
        int status = response.getStatusLine().getStatusCode();
        if (status >= 400) {
            throw new RuntimeException("Push service returned HTTP " + status);
        }
    }

    private byte[] buildPayload(String title, String body, String url) {
        String safeUrl = url != null ? url : "/";
        String json = "{\"title\":\"%s\",\"body\":\"%s\",\"url\":\"%s\"}"
                .formatted(escape(title), escape(body), escape(safeUrl));
        return json.getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
