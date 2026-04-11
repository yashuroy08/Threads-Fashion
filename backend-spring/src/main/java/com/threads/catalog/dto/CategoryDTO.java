package com.threads.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private String id;
    private String name;
    private String slug;
    private String parentId;
    private boolean isActive;
    private Instant createdAt;
}
