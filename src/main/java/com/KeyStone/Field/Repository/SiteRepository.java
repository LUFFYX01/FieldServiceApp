package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SiteRepository extends JpaRepository<Site, Long> {

    List<Site> findByCustomer_Id(Long customerId);

    List<Site> findByActive(Boolean active);
}
