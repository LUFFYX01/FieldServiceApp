package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateSiteRequest;
import com.KeyStone.Field.DTO.SiteResponse;
import com.KeyStone.Field.DTO.UpdateSiteRequest;
import com.KeyStone.Field.Service.SiteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SiteResponse createSite(
            @Valid @RequestBody CreateSiteRequest request) {

        return siteService.createSite(request);
    }

    @GetMapping
    public List<SiteResponse> getAllSites(
            @RequestParam(required = false) Long customerId) {

        if (customerId != null) {
            return siteService.getSitesByCustomerId(customerId);
        }
        return siteService.getAllSites();
    }

    @GetMapping("/{id}")
    public SiteResponse getSiteById(@PathVariable Long id) {

        return siteService.getSiteById(id);
    }

    @PutMapping("/{id}")
    public SiteResponse updateSite(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSiteRequest request) {

        return siteService.updateSite(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSite(@PathVariable Long id) {

        siteService.deleteSite(id);
    }
}
