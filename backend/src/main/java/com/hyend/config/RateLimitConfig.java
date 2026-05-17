package com.hyend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

// TODO [L-11] Rate Limiting 설정 구현 (Auth: 5/분, 일반: 100/분)
@Configuration
public class RateLimitConfig {
    @Bean
    public Bucket authBucket() {
        Refill refill = Refill.greedy(5, Duration.ofMinutes(1));

        Bandwidth limit = Bandwidth.classic(5, refill);

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    @Bean
    public Bucket apiBucket(){

        Refill refill = Refill.greedy(100, Duration.ofMinutes(1));

        Bandwidth limit = Bandwidth.classic(100, refill);

        return Bucket.builder()
                .addLimit(limit)
                .build();

    }

}

