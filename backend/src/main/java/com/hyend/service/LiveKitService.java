package com.hyend.service;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import retrofit2.Response;
import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class LiveKitService {

    private final RoomServiceClient roomServiceClient;

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    public void createRoom(String roomName) {
        try {
            Response<LivekitModels.Room> response = roomServiceClient
                    .createRoom(roomName)
                    .execute();
            if (!response.isSuccessful()) {
                log.warn("LiveKit 방 생성 실패: {}", response.errorBody());
            }
        } catch (IOException e) {
            log.error("LiveKit 방 생성 중 오류", e);
            throw new RuntimeException("LiveKit 방 생성 실패", e);
        }
    }

    public String generateToken(String roomName, String participantIdentity, String participantName) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        return token.toJwt();
    }
}
