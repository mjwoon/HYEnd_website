package com.hyend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RateLimitInterceptor());
    }

    static class RateLimitInterceptor implements HandlerInterceptor {

        private static final int AUTH_CAPACITY = 5;
        private static final int GENERAL_CAPACITY = 100;

        // IP당 버킷을 최대 크기와 비활성 만료로 바인딩 — ConcurrentHashMap의 무한 증가 방지
        private final Cache<String, Bucket> authBuckets = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterAccess(Duration.ofMinutes(2))
                .build();

        private final Cache<String, Bucket> generalBuckets = Caffeine.newBuilder()
                .maximumSize(50_000)
                .expireAfterAccess(Duration.ofMinutes(2))
                .build();

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String ip = resolveClientIp(request);
            boolean isAuth = request.getRequestURI().startsWith("/api/auth/");

            Bucket bucket = isAuth
                    ? authBuckets.get(ip, k -> buildBucket(AUTH_CAPACITY))
                    : generalBuckets.get(ip, k -> buildBucket(GENERAL_CAPACITY));

            if (bucket.tryConsume(1)) {
                return true;
            }

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\"}");
            return false;
        }

        private static Bucket buildBucket(int capacity) {
            Bandwidth limit = Bandwidth.builder()
                    .capacity(capacity)
                    .refillIntervally(capacity, Duration.ofMinutes(1))
                    .build();
            return Bucket.builder().addLimit(limit).build();
        }

        private static String resolveClientIp(HttpServletRequest request) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                return xff.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
    }
}
