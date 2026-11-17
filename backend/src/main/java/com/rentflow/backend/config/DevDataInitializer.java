package com.rentflow.backend.config;

import com.rentflow.backend.property.Property;
import com.rentflow.backend.property.PropertyRepository;
import com.rentflow.backend.user.Role;
import com.rentflow.backend.user.User;
import com.rentflow.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Profile("dev")
public class DevDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataInitializer.class);

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataInitializer(UserRepository userRepository,
                              PropertyRepository propertyRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized, skipping dev data seeding");
            return;
        }

        log.info("Seeding Propzy development demo users and properties...");

        // Create Demo Owner
        User owner = new User();
        owner.setFullName("Sourabh Owner");
        owner.setEmail("owner@propzy.com");
        owner.setPasswordHash(passwordEncoder.encode("Password123!"));
        owner.setRole(Role.OWNER);
        owner.setEmailVerified(true);
        owner = userRepository.save(owner);

        // Create Demo Tenant
        User tenant = new User();
        tenant.setFullName("Alex Tenant");
        tenant.setEmail("tenant@propzy.com");
        tenant.setPasswordHash(passwordEncoder.encode("Password123!"));
        tenant.setRole(Role.TENANT);
        tenant.setEmailVerified(true);
        userRepository.save(tenant);

        log.info("Successfully seeded demo accounts (owner@propzy.com, tenant@propzy.com). Platform starts with zero pre-listed properties.");
    }
}
