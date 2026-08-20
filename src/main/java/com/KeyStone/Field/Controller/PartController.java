package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreatePartRequest;
import com.KeyStone.Field.DTO.PartResponse;
import com.KeyStone.Field.DTO.UpdatePartRequest;
import com.KeyStone.Field.Service.PartService;
import jakarta.validation.Valid;
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
    public PartResponse createPart(
            @Valid @RequestBody CreatePartRequest request) {

        return partService.createPart(request);
    }

    @GetMapping
    public List<PartResponse> getAllParts() {

        return partService.getAllParts();
    }

    @GetMapping("/{id}")
    public PartResponse getPartById(
            @PathVariable Long id) {

        return partService.getPartById(id);
    }

    @PutMapping("/{id}")
    public PartResponse updatePart(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartRequest request) {

        return partService.updatePart(id, request);
    }

    @DeleteMapping("/{id}")
    public void deletePart(
            @PathVariable Long id) {

        partService.deletePart(id);
    }
}