package com.hyend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import io.livekit.server.RoomServiceClient;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class LiveKitServiceTest {

    @Mock
    RoomServiceClient roomServiceClient;

    @InjectMocks
    LiveKitService liveKitService;

    @Test
    void generateToken_returnsNonEmptyJwt() {
        ReflectionTestUtils.setField(liveKitService, "apiKey", "test-key");
        ReflectionTestUtils.setField(liveKitService, "apiSecret", "test-secret-that-is-long-enough-32chars");

        String token = liveKitService.generateToken("room-1", "user-42", "홍길동");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }
}
