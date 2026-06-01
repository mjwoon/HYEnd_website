package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.user.UserResponse;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse updateRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateRole(role);
        return UserResponse.from(user);
    }
}
