package com.rentflow.backend.user;

import com.rentflow.backend.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    private String generateVerificationCode() {
        return String.format("%06d", 100000 + RANDOM.nextInt(900000));
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (request.role() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Public administrator registration is not allowed"
            );
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists"
            );
        }

        String code = generateVerificationCode();
        Instant expiry = Instant.now().plus(Duration.ofHours(24));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(
                request.phone() == null || request.phone().isBlank()
                        ? null
                        : request.phone().trim()
        );
        user.setRole(request.role());
        user.setEmailVerified(false);
        user.setVerificationCode(code);
        user.setVerificationExpiry(expiry);

        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
            log.info("Registered user [{}] with verification code [{}]", email, code);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists",
                    ex
            );
        }

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                false,
                code,
                "Registration successful! Please verify your email with the 6-digit code.",
                savedUser.getCreatedAt()
        );
    }

    @Transactional
    public LoginResponse verifyEmail(VerifyEmailRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String code = request.code().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Account not found for email: " + email
                ));

        if (user.isEmailVerified()) {
            // Already verified, generate login response
            return new LoginResponse(
                    jwtService.generateToken(user),
                    "Bearer",
                    jwtService.getExpirationMillis() / 1000,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole()
            );
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid verification code. Please check and try again."
            );
        }

        if (user.getVerificationExpiry() != null && Instant.now().isAfter(user.getVerificationExpiry())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new code."
            );
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        userRepository.save(user);

        log.info("Email verified successfully for user [{}]", email);

        return new LoginResponse(
                jwtService.generateToken(user),
                "Bearer",
                jwtService.getExpirationMillis() / 1000,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Transactional
    public Map<String, Object> resendVerification(ResendVerificationRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Account not found for email: " + email
                ));

        if (user.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Email is already verified. Please log in."
            );
        }

        String newCode = generateVerificationCode();
        user.setVerificationCode(newCode);
        user.setVerificationExpiry(Instant.now().plus(Duration.ofHours(24)));
        userRepository.save(user);

        log.info("Resent verification code [{}] for user [{}]", newCode, email);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "A new verification code has been sent.");
        response.put("verificationCode", newCode);
        return response;
    }
}
