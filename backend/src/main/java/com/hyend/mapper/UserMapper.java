package com.hyend.mapper;

import com.hyend.dto.auth.RegisterRequest;
import com.hyend.entity.User;
import org.mapstruct.Mapper;

// TODO [H-3] 사용자 MapStruct Mapper 구현
@Mapper(componentModel="spring")
public interface UserMapper {
    User toEntity(RegisterRequest request);

}
