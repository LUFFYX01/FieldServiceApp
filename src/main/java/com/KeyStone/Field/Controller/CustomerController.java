package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateCustomerRequest;
import com.KeyStone.Field.DTO.CustomerResponse;
import com.KeyStone.Field.DTO.UpdateCustomerRequest;
import com.KeyStone.Field.Service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        return customerService.createCustomer(request);
    }

    @GetMapping
    public List<CustomerResponse> getAllCustomers(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return customerService.searchCustomers(search);
        }
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public CustomerResponse getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id);
    }

    @PutMapping("/{id}")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest customerRequest) {
        return customerService.updateCustomer(id, customerRequest);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
    }
}
