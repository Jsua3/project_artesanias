package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Table("categories")
public class Category implements Persistable<UUID> {

    @Id
    private UUID id;
    private String name;
    private String description;
    private Boolean active;

    @Transient
    private boolean isNew = false;

    public Category() {
    }

    public Category(UUID id, String name, String description, Boolean active) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.active = active != null ? active : true;
    }

    // Record-style accessors (used by services)
    public UUID id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String description() {
        return description;
    }

    public Boolean active() {
        return active;
    }

    // Standard getters/setters for R2DBC mapping
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    // Persistable
    @Override
    public boolean isNew() {
        return isNew;
    }

    public Category withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
