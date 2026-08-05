package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateCustomerRequest;
import com.KeyStone.Field.DTO.CustomerResponse;
import com.KeyStone.Field.DTO.UpdateCustomerRequest;
import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Exception.CustomerNotFoundException;
import com.KeyStone.Field.Exception.DuplicateEmailException;
import com.KeyStone.Field.Exception.UserNotFoundException;
import com.KeyStone.Field.Repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerService {


    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerResponse createCustomer(CreateCustomerRequest request){

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

        return new CustomerResponse(
                savedCustomer.getId(),
                savedCustomer.getCompanyName(),
                savedCustomer.getEmail(),
                savedCustomer.getPhone(),
                savedCustomer.getAddress(),
                savedCustomer.getActive(),
                savedCustomer.getCreatedAt()
        );

    }
    public List<CustomerResponse> getAllCustomers(){
      List<Customer> customers = customerRepository.findAll();

      List<CustomerResponse> responseList = new ArrayList<>();
      for(Customer customer : customers){
          CustomerResponse response = new CustomerResponse(customer.getId(),
                  customer.getCompanyName(),
                  customer.getEmail(),
                  customer.getPhone(),
                  customer.getAddress(),
                  customer.getActive(),
                  customer.getCreatedAt());

          responseList.add(response);
      }

      return responseList;
    }

    public CustomerResponse getCustomerById(Long id){
        Customer customer =  customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

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

    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request){
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
        return new CustomerResponse(
                updatedCustomer.getId(),
                updatedCustomer.getCompanyName(),
                updatedCustomer.getEmail(),
                updatedCustomer.getPhone(),
                updatedCustomer.getAddress(),
                updatedCustomer.getActive(),
                updatedCustomer.getCreatedAt()
        );
    }

    public void deleteCustomer(Long id){
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));
        customerRepository.delete(customer);
    }
}
