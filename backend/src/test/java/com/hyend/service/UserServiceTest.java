package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.user.UserResponse;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    @Test
    @DisplayName("사용자 목록 조회 - 필터 없이 전체 조회 성공")
    void getUsers_noFilter_success() {
        User user = mock(User.class);
        given(user.getId()).willReturn(1L);
        given(user.getEmail()).willReturn("test@hyend.ac.kr");
        given(user.getName()).willReturn("홍길동");
        given(user.getRole()).willReturn(User.Role.STUDENT);
        given(user.isActive()).willReturn(true);

        PageRequest pageable = PageRequest.of(0, 10);
        given(userRepository.findAllWithFilter(null, null, pageable))
                .willReturn(new PageImpl<>(List.of(user)));

        Page<UserResponse> result = userService.getUsers(null, null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).email()).isEqualTo("test@hyend.ac.kr");
    }

    @Test
    @DisplayName("사용자 역할 변경 - 성공")
    void updateRole_success() {
        User user = mock(User.class);
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(user.getId()).willReturn(1L);
        given(user.getEmail()).willReturn("test@hyend.ac.kr");
        given(user.getName()).willReturn("홍길동");
        given(user.getRole()).willReturn(User.Role.STAFF);
        given(user.isActive()).willReturn(true);

        UserResponse result = userService.updateRole(1L, User.Role.STAFF);

        assertThat(result.role()).isEqualTo(User.Role.STAFF);
    }

    @Test
    @DisplayName("사용자 역할 변경 - 존재하지 않는 사용자")
    void updateRole_userNotFound() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateRole(99L, User.Role.STAFF))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.USER_NOT_FOUND.getMessage());
    }
}
