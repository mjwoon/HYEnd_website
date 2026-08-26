package com.hyend.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hyend.dto.auth.TokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Repository
public class RefreshTokenRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public RefreshTokenRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper()
                .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    }

    private static final String RT_PREFIX = "rt:";
    private static final String USER_PREFIX = "rt:user:";
    private static final String GRACE_PREFIX = "rt:grace:";

    public void save(String token, Long userId, long expiryMs) {
        String tokenKey = RT_PREFIX + token;
        String userKey = USER_PREFIX + userId;

        redisTemplate.opsForValue().set(tokenKey, String.valueOf(userId), Duration.ofMillis(expiryMs));
        redisTemplate.opsForSet().add(userKey, token);
        redisTemplate.expire(userKey, Duration.ofMillis(expiryMs));
    }

    public Optional<Long> findUserIdByToken(String token) {
        String tokenKey = RT_PREFIX + token;
        Object val = redisTemplate.opsForValue().get(tokenKey);
        if (val == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(val.toString()));
        } catch (NumberFormatException e) {
            log.error("Failed to parse userId from redis value: {}", val, e);
            return Optional.empty();
        }
    }

    public void delete(String token) {
        Optional<Long> userIdOpt = findUserIdByToken(token);
        String tokenKey = RT_PREFIX + token;
        redisTemplate.delete(tokenKey);

        userIdOpt.ifPresent(userId -> {
            String userKey = USER_PREFIX + userId;
            redisTemplate.opsForSet().remove(userKey, token);
        });
    }

    public void deleteByUserId(Long userId) {
        String userKey = USER_PREFIX + userId;
        Set<Object> tokens = redisTemplate.opsForSet().members(userKey);
        if (tokens != null) {
            for (Object tokenObj : tokens) {
                if (tokenObj != null) {
                    redisTemplate.delete(RT_PREFIX + tokenObj.toString());
                }
            }
        }
        redisTemplate.delete(userKey);
    }

    public void saveGracePeriod(String oldToken, TokenResponse newTokens, long ttlMs) {
        String graceKey = GRACE_PREFIX + oldToken;
        try {
            String json = objectMapper.writeValueAsString(newTokens);
            redisTemplate.opsForValue().set(graceKey, json, Duration.ofMillis(ttlMs));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize TokenResponse for grace period", e);
        }
    }

    public Optional<TokenResponse> findGracePeriod(String oldToken) {
        String graceKey = GRACE_PREFIX + oldToken;
        Object val = redisTemplate.opsForValue().get(graceKey);
        if (val == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(val.toString(), TokenResponse.class));
        } catch (Exception e) {
            log.error("Failed to deserialize TokenResponse from grace period", e);
            return Optional.empty();
        }
    }
}
