package com.hyend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

/**
 * Redis 기반 분산 rate limiter (고정 윈도우 카운터).
 *
 * 인메모리(Caffeine) 방식과 달리 카운터가 Redis에 공유되므로 여러 인스턴스에서도
 * 한도가 합산되어 정확하게 적용된다. Redis 장애 시에는 요청을 막지 않는다(fail-open).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisRateLimiter {

    private final StringRedisTemplate redisTemplate;

    // INCR 후 최초 1회만 PEXPIRE를 설정해 윈도우를 원자적으로 관리하고 현재 카운트를 반환한다.
    private static final RedisScript<Long> INCR_WITH_EXPIRE = RedisScript.of(
            "local c = redis.call('INCR', KEYS[1]) " +
            "if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end " +
            "return c", Long.class);

    /**
     * 주어진 키의 윈도우 내 요청 수를 1 증가시키고, capacity 이하이면 허용한다.
     *
     * @return 허용이면 true, 한도 초과면 false. Redis 오류 시 fail-open(true).
     */
    public boolean tryConsume(String key, long capacity, Duration window) {
        try {
            Long count = redisTemplate.execute(
                    INCR_WITH_EXPIRE, List.of(key), String.valueOf(window.toMillis()));
            return count == null || count <= capacity;
        } catch (Exception e) {
            log.warn("Rate limiter Redis 오류 — 요청 허용(fail-open): {}", e.getMessage());
            return true;
        }
    }
}
