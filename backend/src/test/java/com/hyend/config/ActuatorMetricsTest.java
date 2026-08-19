package com.hyend.config;

import io.micrometer.prometheusmetrics.PrometheusMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prometheus 메트릭 레지스트리가 구성되어 실제 메트릭(JVM/시스템)을 노출하는지 검증한다.
 * (HTTP 노출 경로는 management.endpoints…include=prometheus, 접근 제어는 SecurityConfig의
 *  /actuator/** hasRole(ADMIN)로 구성 — 아래는 레지스트리가 실제로 스크레이프 가능한지 확인.)
 */
@SpringBootTest
@ActiveProfiles("test")
class ActuatorMetricsTest {

    @Autowired
    PrometheusMeterRegistry prometheusMeterRegistry;

    @Test
    void prometheusRegistryProducesMetrics() {
        String scrape = prometheusMeterRegistry.scrape();

        assertThat(scrape).isNotBlank();
        assertThat(scrape).contains("jvm_");                 // JVM 메트릭 노출
        assertThat(scrape).contains("application=\"hyend\""); // 공통 태그(spring.application.name) 적용 확인
    }
}
