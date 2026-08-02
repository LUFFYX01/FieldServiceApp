package com.KeyStone.Field.Service;

import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.sql.SQLOutput;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {


    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Customer createCustomer(Customer customer){
        System.out.println("Customer created");
        customer.setActive(true);
        return customerRepository.save(customer);

    }
    public List<Customer> getAllCustomer(){
        System.out.println("All customers are fetched");
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Long id){
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

    }

    public Customer updateCustomer(Long id,Customer updatedCustomer){
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setCompanyName(updatedCustomer.getCompanyName());
        customer.setBillingAddress(updatedCustomer.getBillingAddress());
        customer.setEmail(updatedCustomer.getEmail());
        customer.setPhone(updatedCustomer.getPhone());
        customer.setContactPerson(updatedCustomer.getContactPerson());
        return customerRepository.save(customer);
    }

    public void deleteCustomer(Long id){
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customerRepository.delete(customer);
        System.out.println("Customer Deleted");
    }
}
