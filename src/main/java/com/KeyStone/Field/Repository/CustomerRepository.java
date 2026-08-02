package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository <Customer,Long> {


}
