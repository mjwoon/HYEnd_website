package com.hyend.service;

import com.hyend.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiQuotaServiceTest {

    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks AiQuotaService quotaService;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(quotaService, "whisperDailySeconds", 3600L);
        ReflectionTestUtils.setField(quotaService, "whisperMeetingMaxSeconds", 10800L);
        ReflectionTestUtils.setField(quotaService, "llmMonthlyTokens", 100000L);
        ReflectionTestUtils.setField(quotaService, "llmMeetingMaxCount", 3L);
    }

    @Test
    void consumeWhisper_allowsUnderLimit() {
        when(valueOps.increment(anyString(), anyLong())).thenReturn(100L);
        assertThatCode(() -> quotaService.consumeWhisper(1L, 60)).doesNotThrowAnyException();
    }

    @Test
    void consumeWhisper_blocksWhenMeetingLimitExceeded() {
        // first call (meeting key) returns over limit
        when(valueOps.increment(contains("meeting"), anyLong())).thenReturn(10801L);
        assertThatThrownBy(() -> quotaService.consumeWhisper(1L, 60))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void consumeWhisper_blocksWhenDailyLimitExceeded() {
        when(valueOps.increment(contains("meeting"), anyLong())).thenReturn(100L);
        when(valueOps.increment(contains("daily"), anyLong())).thenReturn(3601L);
        assertThatThrownBy(() -> quotaService.consumeWhisper(1L, 60))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void consumeLlm_allowsUnderLimit() {
        when(valueOps.increment(contains("meeting"), anyLong())).thenReturn(1L);
        when(valueOps.increment(contains("monthly"), anyLong())).thenReturn(1000L);
        assertThatCode(() -> quotaService.consumeLlm(1L, 500)).doesNotThrowAnyException();
    }

    @Test
    void consumeLlm_blocksWhenMeetingCountExceeded() {
        when(valueOps.increment(contains("meeting"), anyLong())).thenReturn(4L);
        assertThatThrownBy(() -> quotaService.consumeLlm(1L, 500))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void consumeLlm_blocksWhenMonthlyTokensExceeded() {
        when(valueOps.increment(contains("meeting"), anyLong())).thenReturn(1L);
        when(valueOps.increment(contains("monthly"), anyLong())).thenReturn(100001L);
        assertThatThrownBy(() -> quotaService.consumeLlm(1L, 500))
                .isInstanceOf(BusinessException.class);
    }
}
