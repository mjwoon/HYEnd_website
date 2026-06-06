package com.hyend.repository;

import com.hyend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE (:role IS NULL OR u.role = :role) AND (:keyword IS NULL OR u.name LIKE %:keyword% OR u.email LIKE %:keyword%)")
    Page<User> findAllWithFilter(@Param("role") User.Role role, @Param("keyword") String keyword, Pageable pageable);
}
