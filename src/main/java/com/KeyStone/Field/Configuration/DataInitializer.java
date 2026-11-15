package com.KeyStone.Field.Configuration;

import com.KeyStone.Field.Entity.*;
import com.KeyStone.Field.Repository.*;
import com.KeyStone.Field.enums.Role;
import com.KeyStone.Field.enums.WorkOrderPriority;
import com.KeyStone.Field.enums.WorkOrderStatus;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final PartRepository partRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderPartRepository workOrderPartRepository;
    private final WorkOrderHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CustomerRepository customerRepository,
                           SiteRepository siteRepository,
                           PartRepository partRepository,
                           WorkOrderRepository workOrderRepository,
                           WorkOrderPartRepository workOrderPartRepository,
                           WorkOrderHistoryRepository historyRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.partRepository = partRepository;
        this.workOrderRepository = workOrderRepository;
        this.workOrderPartRepository = workOrderPartRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        // 1. Users
        User admin = userRepository.save(User.builder()
                .userName("System Administrator")
                .email("admin@keystone.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .active(true)
                .build());

        User dispatcher = userRepository.save(User.builder()
                .userName("Operations Dispatcher")
                .email("dispatcher@keystone.com")
                .password(passwordEncoder.encode("dispatcher123"))
                .role(Role.DISPATCHER)
                .active(true)
                .build());

        User tech1 = userRepository.save(User.builder()
                .userName("John Technician")
                .email("tech1@keystone.com")
                .password(passwordEncoder.encode("tech123"))
                .role(Role.TECHNICIAN)
                .active(true)
                .build());

        User tech2 = userRepository.save(User.builder()
                .userName("Sarah Technician")
                .email("tech2@keystone.com")
                .password(passwordEncoder.encode("tech123"))
                .role(Role.TECHNICIAN)
                .active(true)
                .build());

        // 2. Customers
        Customer customer1 = customerRepository.save(Customer.builder()
                .companyName("Acme Industrial Corp")
                .contactPerson("Robert Vance")
                .email("contact@acmeindustrial.com")
                .phone("5550199123")
                .address("100 Industrial Parkway, Detroit, MI")
                .active(true)
                .build());

        Customer customer2 = customerRepository.save(Customer.builder()
                .companyName("Apex Logistics Ltd")
                .contactPerson("Elena Rostova")
                .email("operations@apexlogistics.com")
                .phone("5550244123")
                .address("450 Cargo Center Way, Chicago, IL")
                .active(true)
                .build());

        // 3. Sites
        Site site1 = siteRepository.save(Site.builder()
                .siteName("Acme HQ - Plant 1")
                .address("100 Industrial Parkway, Bldg A, Detroit, MI")
                .contactPerson("Marcus Bell")
                .phone("5550190123")
                .active(true)
                .customer(customer1)
                .build());

        Site site2 = siteRepository.save(Site.builder()
                .siteName("Acme Warehouse East")
                .address("105 Industrial Parkway, Bldg C, Detroit, MI")
                .contactPerson("Laura Smith")
                .phone("5550191123")
                .active(true)
                .customer(customer1)
                .build());

        Site site3 = siteRepository.save(Site.builder()
                .siteName("Apex Distribution Center #4")
                .address("450 Cargo Center Way, Bay 12, Chicago, IL")
                .contactPerson("David Miller")
                .phone("5550245123")
                .active(true)
                .customer(customer2)
                .build());

        // 4. Parts
        Part part1 = partRepository.save(Part.builder()
                .name("Hydraulic Pump Motor 5HP")
                .partNumber("HPM-101")
                .description("Heavy-duty high pressure hydraulic pump replacement motor")
                .quantity(15)
                .price(new BigDecimal("249.99"))
                .active(true)
                .lowStockThreshold(5)
                .build());

        Part part2 = partRepository.save(Part.builder()
                .name("Control Board PCB v2")
                .partNumber("PCB-202")
                .description("Main motherboard controller with micro-relay switches")
                .quantity(25)
                .price(new BigDecimal("89.50"))
                .active(true)
                .lowStockThreshold(5)
                .build());

        Part part3 = partRepository.save(Part.builder()
                .name("Filter Element 5 Micron")
                .partNumber("FLT-005")
                .description("High efficiency hydraulic fluid particulate filter")
                .quantity(50)
                .price(new BigDecimal("18.25"))
                .active(true)
                .lowStockThreshold(10)
                .build());

        Part part4 = partRepository.save(Part.builder()
                .name("Pressure Relief Valve 3000 PSI")
                .partNumber("PRV-303")
                .description("Adjustable high tolerance pressure relief safety valve")
                .quantity(8)
                .price(new BigDecimal("45.00"))
                .active(true)
                .lowStockThreshold(3)
                .build());

        Part part5 = partRepository.save(Part.builder()
                .name("Industrial Seal Kit")
                .partNumber("SLK-404")
                .description("Nitrile high-temperature hydraulic cylinder O-ring kit")
                .quantity(40)
                .price(new BigDecimal("12.00"))
                .active(true)
                .lowStockThreshold(10)
                .build());

        // 5. Work Order
        WorkOrder workOrder = workOrderRepository.save(WorkOrder.builder()
                .title("Quarterly Hydraulic System Overhaul")
                .description("Perform complete inspection and component replacement for main hydraulic circuit.")
                .priority(WorkOrderPriority.HIGH)
                .status(WorkOrderStatus.ASSIGNED)
                .customer(customer1)
                .site(site1)
                .assignedTechnician(tech1)
                .scheduledDate(LocalDateTime.now().plusDays(1))
                .notes("Check pressure relief threshold during testing.")
                .build());

        historyRepository.save(WorkOrderHistory.builder()
                .workOrder(workOrder)
                .status(WorkOrderStatus.OPEN)
                .description("Work order created")
                .build());

        historyRepository.save(WorkOrderHistory.builder()
                .workOrder(workOrder)
                .status(WorkOrderStatus.ASSIGNED)
                .description("Technician assigned: " + tech1.getUserName())
                .build());

        // 6. Work Order Parts
        workOrderPartRepository.save(WorkOrderPart.builder()
                .workOrder(workOrder)
                .part(part1)
                .requiredQuantity(1)
                .usedQuantity(0)
                .build());

        workOrderPartRepository.save(WorkOrderPart.builder()
                .workOrder(workOrder)
                .part(part5)
                .requiredQuantity(2)
                .usedQuantity(0)
                .build());
    }
}
