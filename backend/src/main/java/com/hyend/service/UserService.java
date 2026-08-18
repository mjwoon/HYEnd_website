package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.user.UserResponse;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getMe(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public Page<UserResponse> getUsers(User.Role role, String keyword, Pageable pageable) {
        return userRepository.findAllWithFilter(role, keyword, pageable)
                .map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateRole(role);
        return UserResponse.from(user);
    }
}
