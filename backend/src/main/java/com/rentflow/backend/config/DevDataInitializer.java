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
        owner = userRepository.save(owner);

        // Create Demo Tenant
        User tenant = new User();
        tenant.setFullName("Alex Tenant");
        tenant.setEmail("tenant@propzy.com");
        tenant.setPasswordHash(passwordEncoder.encode("Password123!"));
        tenant.setRole(Role.TENANT);
        userRepository.save(tenant);

        // Seed 15 sample properties across cities
        List<Property> properties = List.of(
            createProperty("Sea Breeze Penthouse", "Ultra-luxury penthouse with sweeping views of the Arabian Sea and private terrace.", new BigDecimal("85000.00"), "Penthouse", "Marine Drive", "Mumbai", 3, 3, owner),
            createProperty("Bandra Modern Studio", "Chic, fully-furnished minimalist studio in the heart of trendy Bandra West.", new BigDecimal("38000.00"), "Studio", "Pali Hill, Bandra West", "Mumbai", 1, 1, owner),
            createProperty("Powai Lakeview 2BHK", "Spacious 2BHK facing Powai lake with modular kitchen and clubhouse access.", new BigDecimal("52000.00"), "Apartment", "Hiranandani Gardens, Powai", "Mumbai", 2, 2, owner),
            createProperty("Juhu Sun-Drenched 3BHK", "Beachside 3BHK with floor-to-ceiling windows, wooden flooring and concierge.", new BigDecimal("95000.00"), "Apartment", "Gulmohar Road, Juhu", "Mumbai", 3, 3, owner),
            createProperty("Indiranagar Garden Villa", "Independent duplex villa with private lawn, solar heating and EV charging point.", new BigDecimal("68000.00"), "Villa", "100ft Road, Indiranagar", "Bangalore", 4, 3, owner),
            createProperty("Koramangala Techie Haven", "Smart home enabled apartment with high-speed fiber internet and dedicated workspace.", new BigDecimal("42000.00"), "Apartment", "4th Block, Koramangala", "Bangalore", 2, 2, owner),
            createProperty("Whitefield Luxury High-Rise", "Premium 3BHK near major tech parks with infinity pool and badminton court.", new BigDecimal("48000.00"), "Apartment", "ITPL Main Road, Whitefield", "Bangalore", 3, 3, owner),
            createProperty("HSR Layout Cozy 1BHK", "Well-ventilated 1BHK close to sector 1 parks, cafes, and supermarkets.", new BigDecimal("26000.00"), "Apartment", "Sector 1, HSR Layout", "Bangalore", 1, 1, owner),
            createProperty("Greater Kailash Colonial Villa", "Heritage-style villa with courtyard, antique wooden details and private garage.", new BigDecimal("90000.00"), "Villa", "M-Block, Greater Kailash II", "Delhi", 4, 4, owner),
            createProperty("Hauz Khas Boho Apartment", "Artistic 2BHK with balcony looking out onto greenery near the historic fort.", new BigDecimal("46000.00"), "Apartment", "Aurobindo Marg, Hauz Khas", "Delhi", 2, 2, owner),
            createProperty("Gurgaon Golf Course 3BHK", "Executive high-rise condominium overlooking the DLF Golf Course with luxury fittings.", new BigDecimal("75000.00"), "Condo", "Golf Course Road, Sector 54", "Delhi", 3, 3, owner),
            createProperty("Connaught Place Classic Flat", "Historic colonial architecture with high ceilings, spacious hall and balcony.", new BigDecimal("60000.00"), "Apartment", "Barakhamba Road, CP", "Delhi", 2, 2, owner),
            createProperty("Cyber City Executive Studio", "Conveniently situated studio apartment walking distance from Rapid Metro.", new BigDecimal("28000.00"), "Studio", "DLF Cyber City, Sector 24", "Delhi", 1, 1, owner),
            createProperty("Vasant Vihar Embassy Residence", "Secure, expansive residence in prime embassy area with private security post.", new BigDecimal("120000.00"), "Villa", "Poorvi Marg, Vasant Vihar", "Delhi", 5, 5, owner),
            createProperty("Andheri East Metro Connect", "Modern 1BHK directly connected to Western Express Highway and Metro line 1.", new BigDecimal("32000.00"), "Apartment", "JB Nagar, Andheri East", "Mumbai", 1, 1, owner)
        );

        propertyRepository.saveAll(properties);
        log.info("Successfully seeded 15 demo properties and 2 demo accounts (owner@propzy.com, tenant@propzy.com).");
    }

    private Property createProperty(String title, String description, BigDecimal rentAmount,
                                    String propertyType, String address, String city,
                                    int bedrooms, int bathrooms, User owner) {
        Property property = new Property();
        property.setTitle(title);
        property.setDescription(description);
        property.setRentAmount(rentAmount);
        property.setPropertyType(propertyType);
        property.setAddress(address);
        property.setCity(city);
        property.setBedrooms(bedrooms);
        property.setBathrooms(bathrooms);
        property.setAvailable(true);
        property.setOwner(owner);
        return property;
    }
}
