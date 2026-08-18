package com.hyend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class RateLimitConfig implements WebMvcConfigurer {

    private final RedisRateLimiter rateLimiter;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RateLimitInterceptor(rateLimiter));
        registry.addInterceptor(new AiRateLimitInterceptor(rateLimiter))
                .addPathPatterns("/api/meetings/*/minutes");
    }

    static class RateLimitInterceptor implements HandlerInterceptor {

        private static final int AUTH_CAPACITY = 30;
        private static final int GENERAL_CAPACITY = 100;
        private static final Duration WINDOW = Duration.ofMinutes(1);

        private final RedisRateLimiter rateLimiter;

        RateLimitInterceptor(RedisRateLimiter rateLimiter) {
            this.rateLimiter = rateLimiter;
        }

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String ip = resolveClientIp(request);
            boolean isAuth = request.getRequestURI().startsWith("/api/auth/");
            int capacity = isAuth ? AUTH_CAPACITY : GENERAL_CAPACITY;
            String key = "ratelimit:" + (isAuth ? "auth:" : "general:") + ip;

            if (rateLimiter.tryConsume(key, capacity, WINDOW)) {
                return true;
            }

            reject(response, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
            return false;
        }
    }

    static class AiRateLimitInterceptor implements HandlerInterceptor {

        private static final int AI_CAPACITY = 5;
        private static final Duration AI_WINDOW = Duration.ofHours(1);

        private final RedisRateLimiter rateLimiter;

        AiRateLimitInterceptor(RedisRateLimiter rateLimiter) {
            this.rateLimiter = rateLimiter;
        }

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
            String ip = resolveClientIp(request);
            String key = "ratelimit:ai:" + ip;

            if (rateLimiter.tryConsume(key, AI_CAPACITY, AI_WINDOW)) {
                return true;
            }

            reject(response, "AI 기능은 시간당 5회까지만 사용할 수 있습니다.");
            return false;
        }
    }

    static void reject(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
