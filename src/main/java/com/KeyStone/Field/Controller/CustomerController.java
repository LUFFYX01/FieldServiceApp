package com.KeyStone.Field.Controller;

import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Service.CustomerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService){
        this.customerService = customerService;
    }

    @PostMapping
    public Customer createCustomer(@RequestBody Customer customer){

        return customerService.createCustomer(customer);
    }

    @GetMapping("/find")
    public List<Customer> getAllCustomer(){
        return customerService.getAllCustomer();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id);
    }

    @PutMapping("/{id}")
    public Customer updateCustomer(
            @PathVariable Long id,
            @RequestBody Customer customerRequest){
        return customerService.updateCustomer(id, customerRequest);
    }

    @DeleteMapping("/{id}")
    public void deleteCustomer(@PathVariable Long id){
        customerService.deleteCustomer(id);
    }


    @GetMapping("/test")
    public String test() {
        return "Customer Controller is working!";
    }
}
