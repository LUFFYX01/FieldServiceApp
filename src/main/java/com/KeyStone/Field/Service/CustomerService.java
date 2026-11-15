package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateCustomerRequest;
import com.KeyStone.Field.DTO.CustomerResponse;
import com.KeyStone.Field.DTO.UpdateCustomerRequest;
import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Exception.CustomerNotFoundException;
import com.KeyStone.Field.Exception.DuplicateEmailException;
import com.KeyStone.Field.Repository.CustomerRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final WorkOrderRepository workOrderRepository;

    public CustomerService(CustomerRepository customerRepository,
                           WorkOrderRepository workOrderRepository) {
        this.customerRepository = customerRepository;
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException();
        }

        Customer customer = new Customer();
        customer.setCompanyName(request.getCompanyName());
        customer.setContactPerson(request.getContactPerson());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setActive(true);

        Customer savedCustomer = customerRepository.save(customer);
        return mapToResponse(savedCustomer);
    }

    public List<CustomerResponse> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        List<CustomerResponse> responseList = new ArrayList<>();
        for (Customer customer : customers) {
            responseList.add(mapToResponse(customer));
        }
        return responseList;
    }

    public List<CustomerResponse> searchCustomers(String query) {
        List<Customer> customers = (query == null || query.isBlank())
                ? customerRepository.findAll()
                : customerRepository.findByCompanyNameContainingIgnoreCase(query);

        List<CustomerResponse> responseList = new ArrayList<>();
        for (Customer customer : customers) {
            responseList.add(mapToResponse(customer));
        }
        return responseList;
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));
        return mapToResponse(customer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        if (customerRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateEmailException();
        }

        customer.setCompanyName(request.getCompanyName());
        customer.setAddress(request.getAddress());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setContactPerson(request.getContactPerson());

        Customer updatedCustomer = customerRepository.save(customer);
        return mapToResponse(updatedCustomer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        // If customer has work orders, soft-delete to maintain history
        if (workOrderRepository.existsByCustomer_Id(id)) {
            customer.setActive(false);
            customerRepository.save(customer);
        } else {
            customerRepository.delete(customer);
        }
    }

    private CustomerResponse mapToResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCompanyName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getActive(),
                customer.getCreatedAt()
        );
    }
}
