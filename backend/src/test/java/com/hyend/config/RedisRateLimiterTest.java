package com.hyend.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 Redis(Testcontainers)에 대해 분산 rate limiter가 한도를 정확히 적용하는지 검증한다.
 * 카운터가 Redis에 공유되므로 이 동작이 여러 인스턴스 간 한도 합산의 근거가 된다.
 */
@Testcontainers
class RedisRateLimiterTest {

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private RedisRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
        rateLimiter = new RedisRateLimiter(template);
    }

    @AfterEach
    void tearDown() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
    }

    @Test
    void allowsUpToCapacityThenBlocks() {
        String key = "ratelimit:test:1.2.3.4";
        long capacity = 30;
        Duration window = Duration.ofMinutes(1);

        for (int i = 1; i <= capacity; i++) {
            assertThat(rateLimiter.tryConsume(key, capacity, window))
                    .as("요청 %d회차는 허용되어야 함", i).isTrue();
        }
        assertThat(rateLimiter.tryConsume(key, capacity, window))
                .as("한도 초과 요청은 차단되어야 함").isFalse();
    }

    @Test
    void keysAreIndependent() {
        Duration window = Duration.ofMinutes(1);
        assertThat(rateLimiter.tryConsume("ratelimit:a", 1, window)).isTrue();
        assertThat(rateLimiter.tryConsume("ratelimit:a", 1, window)).isFalse();  // a 소진
        assertThat(rateLimiter.tryConsume("ratelimit:b", 1, window)).isTrue();   // b는 독립
    }
}
