package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreatePartRequest;
import com.KeyStone.Field.DTO.PartResponse;
import com.KeyStone.Field.DTO.UpdatePartRequest;
import com.KeyStone.Field.Entity.Part;
import com.KeyStone.Field.Exception.DuplicatePartNumberException;
import com.KeyStone.Field.Exception.PartNotFoundException;
import com.KeyStone.Field.Repository.PartRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public PartResponse createPart(CreatePartRequest request) {

        if (partRepository.existsByPartNumber(
                request.getPartNumber())) {

            throw new DuplicatePartNumberException(
                    request.getPartNumber());
        }

        Part part = new Part();

        part.setName(request.getName());
        part.setPartNumber(request.getPartNumber());
        part.setDescription(request.getDescription());
        part.setQuantity(request.getQuantity());
        part.setPrice(request.getPrice());
        part.setActive(true);

        Part savedPart =
                partRepository.save(part);

        return mapToResponse(savedPart);
    }

    public List<PartResponse> getAllParts() {

        List<Part> parts =
                partRepository.findAll();

        List<PartResponse> responseList =
                new ArrayList<>();

        for (Part part : parts) {
            responseList.add(
                    mapToResponse(part)
            );
        }

        return responseList;
    }

    public PartResponse getPartById(Long id) {

        Part part =
                partRepository.findById(id)
                        .orElseThrow(() ->
                                new PartNotFoundException(id));

        return mapToResponse(part);
    }

    public PartResponse updatePart(
            Long id,
            UpdatePartRequest request) {

        Part part =
                partRepository.findById(id)
                        .orElseThrow(() ->
                                new PartNotFoundException(id));

        if (partRepository.existsByPartNumber(
                request.getPartNumber())
                &&
                !part.getPartNumber()
                        .equals(request.getPartNumber())) {

            throw new DuplicatePartNumberException(
                    request.getPartNumber());
        }

        part.setName(request.getName());
        part.setPartNumber(request.getPartNumber());
        part.setDescription(request.getDescription());
        part.setQuantity(request.getQuantity());
        part.setPrice(request.getPrice());
        part.setActive(request.getActive());

        Part updatedPart =
                partRepository.save(part);

        return mapToResponse(updatedPart);
    }

    public void deletePart(Long id) {

        Part part =
                partRepository.findById(id)
                        .orElseThrow(() ->
                                new PartNotFoundException(id));

        partRepository.delete(part);
    }

    private PartResponse mapToResponse(Part part) {

        return PartResponse.builder()
                .id(part.getId())
                .name(part.getName())
                .partNumber(part.getPartNumber())
                .description(part.getDescription())
                .quantity(part.getQuantity())
                .price(part.getPrice())
                .active(part.getActive())
                .createdAt(part.getCreatedAt())
                .build();
    }
}