package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreatePartRequest;
import com.KeyStone.Field.DTO.InventoryTransactionResponse;
import com.KeyStone.Field.DTO.PartResponse;
import com.KeyStone.Field.DTO.StockAdjustmentRequest;
import com.KeyStone.Field.DTO.UpdatePartRequest;
import com.KeyStone.Field.Service.PartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PartResponse createPart(
            @Valid @RequestBody CreatePartRequest request) {

        return partService.createPart(request);
    }

    @GetMapping
    public List<PartResponse> getAllParts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly) {

        if (query != null && !query.isBlank()) {
            return partService.searchParts(query);
        }
        if (Boolean.TRUE.equals(activeOnly)) {
            return partService.getActiveParts();
        }
        return partService.getAllParts();
    }

    @GetMapping("/{id}")
    public PartResponse getPartById(@PathVariable Long id) {
        return partService.getPartById(id);
    }

    @PutMapping("/{id}")
    public PartResponse updatePart(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartRequest request) {

        return partService.updatePart(id, request);
    }

    @PostMapping("/{id}/adjust-stock")
    public PartResponse adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody StockAdjustmentRequest request) {

        return partService.adjustStock(id, request);
    }

    @GetMapping("/{id}/transactions")
    public List<InventoryTransactionResponse> getPartTransactions(@PathVariable Long id) {
        return partService.getPartTransactions(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePart(@PathVariable Long id) {
        partService.deletePart(id);
    }
}
