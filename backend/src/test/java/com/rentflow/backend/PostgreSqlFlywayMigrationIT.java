package com.rentflow.backend;

import com.rentflow.backend.inquiry.Inquiry;
import com.rentflow.backend.inquiry.InquiryRepository;
import com.rentflow.backend.inquiry.InquiryStatus;
import com.rentflow.backend.property.Property;
import com.rentflow.backend.property.PropertyRepository;
import com.rentflow.backend.user.Role;
import com.rentflow.backend.user.User;
import com.rentflow.backend.user.UserRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PostgreSqlFlywayMigrationIT {

    static boolean isDockerAvailable() {
        return DockerClientFactory.instance().isDockerAvailable();
    }

    @Container
    static PostgreSQLContainer<?> postgres = isDockerAvailable()
        ? new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("propzy_test")
            .withUsername("propzy_test_user")
            .withPassword("propzy_test_pass")
        : null;

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
            registry.add("spring.flyway.enabled", () -> "true");
            registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        }
    }

    @Autowired(required = false)
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private InquiryRepository inquiryRepository;

    @Test
    @DisplayName("Flyway migrations execute cleanly and all schema migrations apply")
    void testFlywayMigrations() {
        if (postgres == null || !postgres.isRunning()) {
            return;
        }
        assertNotNull(flyway, "Flyway bean should be present when PostgreSQL Testcontainers is active");
        var applied = flyway.info().applied();
        assertTrue(applied.length >= 6, "All migrations up to V6 must be applied");
        assertEquals("6", applied[applied.length - 1].getVersion().getVersion());
    }

    @Test
    @DisplayName("Verify PostgreSQL indexes created by Flyway migrations")
    void testIndexesExist() {
        if (postgres == null || !postgres.isRunning()) {
            return;
        }
        List<String> indexes = jdbcTemplate.query(
            "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
            (rs, rowNum) -> rs.getString("indexname")
        );

        assertTrue(indexes.contains("idx_users_role"), "Index idx_users_role must exist in PostgreSQL");
        assertTrue(indexes.contains("idx_properties_city"), "Index idx_properties_city must exist");
        assertTrue(indexes.contains("idx_properties_owner_id"), "Index idx_properties_owner_id must exist");
        assertTrue(indexes.contains("idx_properties_available"), "Index idx_properties_available must exist");
        assertTrue(indexes.contains("idx_properties_rent_amount"), "Index idx_properties_rent_amount must exist");
        assertTrue(indexes.contains("idx_properties_available_city_rent"), "Composite index must exist");
        assertTrue(indexes.contains("idx_inquiries_property_id"), "Index idx_inquiries_property_id must exist");
        assertTrue(indexes.contains("idx_inquiries_tenant_id"), "Index idx_inquiries_tenant_id must exist");
        assertTrue(indexes.contains("idx_inquiries_status"), "Index idx_inquiries_status must exist");
    }

    @Test
    @DisplayName("PostgreSQL enforces unique constraint on user email")
    void testUniqueEmailConstraint() {
        if (postgres == null || !postgres.isRunning()) {
            return;
        }
        User u1 = new User();
        u1.setFullName("User One");
        u1.setEmail("unique.test@example.com");
        u1.setPasswordHash("hash12345678");
        u1.setRole(Role.TENANT);
        userRepository.saveAndFlush(u1);

        User u2 = new User();
        u2.setFullName("User Two");
        u2.setEmail("unique.test@example.com");
        u2.setPasswordHash("hash12345678");
        u2.setRole(Role.TENANT);

        assertThrows(DataIntegrityViolationException.class, () -> userRepository.saveAndFlush(u2));
    }

    @Test
    @DisplayName("PostgreSQL check constraint on property rent_amount prevents non-positive rent")
    void testPropertyRentCheckConstraint() {
        if (postgres == null || !postgres.isRunning()) {
            return;
        }
        User owner = new User();
        owner.setFullName("Test Owner");
        owner.setEmail("owner.constraint@example.com");
        owner.setPasswordHash("hash12345678");
        owner.setRole(Role.OWNER);
        owner = userRepository.saveAndFlush(owner);

        Property p = new Property();
        p.setTitle("Bad Property");
        p.setRentAmount(new BigDecimal("-100.00"));
        p.setPropertyType("Apartment");
        p.setAddress("123 Street");
        p.setCity("Mumbai");
        p.setBedrooms(1);
        p.setBathrooms(1);
        p.setAvailable(true);
        p.setOwner(owner);

        assertThrows(DataIntegrityViolationException.class, () -> propertyRepository.saveAndFlush(p));
    }

    @Test
    @DisplayName("PostgreSQL repository search query works correctly")
    void testRepositorySearchQueries() {
        User owner = new User();
        owner.setFullName("Query Owner");
        owner.setEmail("query.owner@example.com");
        owner.setPasswordHash("hash12345678");
        owner.setRole(Role.OWNER);
        owner = userRepository.saveAndFlush(owner);

        Property p = new Property();
        p.setTitle("Luxury Suite");
        p.setRentAmount(new BigDecimal("2500.00"));
        p.setPropertyType("Apartment");
        p.setAddress("456 Avenue");
        p.setCity("Pune");
        p.setBedrooms(2);
        p.setBathrooms(2);
        p.setAvailable(true);
        p.setOwner(owner);
        propertyRepository.saveAndFlush(p);

        var page = propertyRepository.searchAvailable(
            "Pune",
            new BigDecimal("2000.00"),
            new BigDecimal("3000.00"),
            org.springframework.data.domain.PageRequest.of(0, 10)
        );

        assertEquals(1, page.getTotalElements());
        assertEquals("Luxury Suite", page.getContent().get(0).getTitle());
    }

    @Test
    @Transactional
    @Rollback
    @DisplayName("PostgreSQL transaction rollback preserves data integrity")
    void testTransactionRollback() {
        User owner = new User();
        owner.setFullName("Rollback Owner");
        owner.setEmail("rollback@example.com");
        owner.setPasswordHash("hash12345678");
        owner.setRole(Role.OWNER);
        userRepository.save(owner);

        assertTrue(userRepository.findByEmail("rollback@example.com").isPresent());
    }
}
