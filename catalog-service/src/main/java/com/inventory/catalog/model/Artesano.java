package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("artesanos")
public class Artesano implements Persistable<UUID> {

    @Id
    private UUID id;
    private String nombre;
    private String telefono;
    private String email;
    private String especialidad;
    private String ubicacion;
    private Boolean active;
    private LocalDateTime createdAt;

    @Transient
    private boolean isNew = false;

    public Artesano() {
    }

    public Artesano(UUID id, String nombre, String telefono, String email,
                    String especialidad, String ubicacion, Boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.especialidad = especialidad;
        this.ubicacion = ubicacion;
        this.active = active != null ? active : true;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    // Record-style accessors
    public UUID id() {
        return id;
    }

    public String nombre() {
        return nombre;
    }

    public String telefono() {
        return telefono;
    }

    public String email() {
        return email;
    }

    public String especialidad() {
        return especialidad;
    }

    public String ubicacion() {
        return ubicacion;
    }

    public Boolean active() {
        return active;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    // Standard getters/setters for R2DBC mapping
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Persistable
    @Override
    public boolean isNew() {
        return isNew;
    }

    public Artesano withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
