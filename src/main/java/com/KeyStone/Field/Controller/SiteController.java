package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateSiteRequest;
import com.KeyStone.Field.DTO.SiteResponse;
import com.KeyStone.Field.DTO.UpdateSiteRequest;
import com.KeyStone.Field.Service.SiteService;
import jakarta.validation.Valid;
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
    public SiteResponse createSite(
            @Valid @RequestBody CreateSiteRequest request) {

        return siteService.createSite(request);
    }

    @GetMapping
    public List<SiteResponse> getAllSites() {

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
    public void deleteSite(@PathVariable Long id) {

        siteService.deleteSite(id);
    }
}