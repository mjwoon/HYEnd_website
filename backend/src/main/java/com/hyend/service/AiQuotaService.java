package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AiQuotaService {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${ai.quota.whisper-daily-seconds}") private long whisperDailySeconds;
    @Value("${ai.quota.whisper-meeting-max-seconds}") private long whisperMeetingMaxSeconds;
    @Value("${ai.quota.llm-monthly-tokens}") private long llmMonthlyTokens;
    @Value("${ai.quota.llm-meeting-max-count}") private long llmMeetingMaxCount;

    public void consumeWhisper(Long roomId, long audioSeconds) {
        String meetingKey = "ai:quota:whisper:meeting:" + roomId;
        long meetingUsed = increment(meetingKey, audioSeconds, Duration.ofDays(7));
        if (meetingUsed > whisperMeetingMaxSeconds) {
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }

        String dailyKey = "ai:quota:whisper:daily:" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        long dailyUsed = increment(dailyKey, audioSeconds, Duration.ofDays(2));
        if (dailyUsed > whisperDailySeconds) {
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }
    }

    public void consumeLlm(Long roomId, long tokens) {
        String meetingCountKey = "ai:quota:llm:meeting:" + roomId;
        long meetingCount = increment(meetingCountKey, 1, Duration.ofDays(7));
        if (meetingCount > llmMeetingMaxCount) {
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }

        String monthlyKey = "ai:quota:llm:monthly:" + YearMonth.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long monthlyUsed = increment(monthlyKey, tokens, Duration.ofDays(35));
        if (monthlyUsed > llmMonthlyTokens) {
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }
    }

    private long increment(String key, long delta, Duration ttl) {
        Long value = stringRedisTemplate.opsForValue().increment(key, delta);
        if (value != null && value == delta) {
            stringRedisTemplate.expire(key, ttl);
        }
        return value == null ? delta : value;
    }
}
