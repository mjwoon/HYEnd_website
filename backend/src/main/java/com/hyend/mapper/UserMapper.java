package com.hyend.mapper;

import com.hyend.dto.auth.RegisterRequest;
import com.hyend.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel="spring")
public interface UserMapper {
    // User toEntity(RegisterRequest request);

}
