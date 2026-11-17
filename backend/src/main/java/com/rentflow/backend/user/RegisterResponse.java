package com.rentflow.backend.user;

import java.time.Instant;

public record RegisterResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        boolean emailVerified,
        String verificationCode,
        String message,
        Instant createdAt
) {
}
