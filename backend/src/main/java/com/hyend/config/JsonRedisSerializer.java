package com.hyend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;

import java.nio.charset.StandardCharsets;

/**
 * Spring Boot 4.x에서 deprecated된 Jackson Redis 시리얼라이저 대체 구현.
 * ObjectMapper를 직접 사용해 타입 정보를 포함한 JSON 직렬화를 수행한다.
 */
public class JsonRedisSerializer implements RedisSerializer<Object> {

    private final ObjectMapper objectMapper;

    public JsonRedisSerializer() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
    }

    @Override
    public byte[] serialize(Object value) throws SerializationException {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception e) {
            throw new SerializationException("JSON 직렬화 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Object deserialize(byte[] bytes) throws SerializationException {
        if (bytes == null || bytes.length == 0) return null;
        try {
            return objectMapper.readValue(bytes, Object.class);
        } catch (Exception e) {
            throw new SerializationException("JSON 역직렬화 실패: " + e.getMessage(), e);
        }
    }
}
