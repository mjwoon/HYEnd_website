package com.hyend.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * spring.transaction.default-timeout(전역 트랜잭션 기본 타임아웃)이
 * 실제 트랜잭션 매니저에 반영됐는지 검증한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class TransactionTimeoutConfigTest {

    @Autowired
    PlatformTransactionManager transactionManager;

    @Test
    void globalDefaultTransactionTimeoutIsApplied() {
        assertThat(transactionManager).isInstanceOf(AbstractPlatformTransactionManager.class);
        assertThat(((AbstractPlatformTransactionManager) transactionManager).getDefaultTimeout())
                .isEqualTo(30);
    }
}
