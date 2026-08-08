package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateSiteRequest;
import com.KeyStone.Field.DTO.SiteResponse;
import com.KeyStone.Field.DTO.UpdateSiteRequest;
import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Entity.Site;
import com.KeyStone.Field.Exception.CustomerNotFoundException;
import com.KeyStone.Field.Exception.SiteNotFoundException;
import com.KeyStone.Field.Repository.CustomerRepository;
import com.KeyStone.Field.Repository.SiteRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final CustomerRepository customerRepository;

    public SiteService(SiteRepository siteRepository,
                       CustomerRepository customerRepository) {
        this.siteRepository = siteRepository;
        this.customerRepository = customerRepository;
    }

    public SiteResponse createSite(CreateSiteRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() ->
                        new CustomerNotFoundException(request.getCustomerId()));

        Site site = new Site();

        site.setSiteName(request.getSiteName());
        site.setAddress(request.getAddress());
        site.setContactPerson(request.getContactPerson());
        site.setPhone(request.getPhone());
        site.setActive(true);
        site.setCustomer(customer);

        Site savedSite = siteRepository.save(site);

        return mapToResponse(savedSite);
    }

    public List<SiteResponse> getAllSites() {

        List<Site> sites = siteRepository.findAll();

        List<SiteResponse> responseList = new ArrayList<>();

        for (Site site : sites) {
            responseList.add(mapToResponse(site));
        }

        return responseList;
    }

    public SiteResponse getSiteById(Long id) {

        Site site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new SiteNotFoundException(id));

        return mapToResponse(site);
    }

    public SiteResponse updateSite(Long id,
                                   UpdateSiteRequest request) {

        Site site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new SiteNotFoundException(id));

        site.setSiteName(request.getSiteName());
        site.setAddress(request.getAddress());
        site.setContactPerson(request.getContactPerson());
        site.setPhone(request.getPhone());
        site.setActive(request.getActive());

        Site updatedSite = siteRepository.save(site);

        return mapToResponse(updatedSite);
    }

    public void deleteSite(Long id) {

        Site site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new SiteNotFoundException(id));

        siteRepository.delete(site);
    }

    private SiteResponse mapToResponse(Site site) {

        return SiteResponse.builder()
                .id(site.getId())
                .siteName(site.getSiteName())
                .address(site.getAddress())
                .contactPerson(site.getContactPerson())
                .phone(site.getPhone())
                .active(site.getActive())
                .customerId(site.getCustomer().getId())
                .customerName(site.getCustomer().getCompanyName())
                .createdAt(site.getCreatedAt())
                .build();
    }
}