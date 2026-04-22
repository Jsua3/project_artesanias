package com.inventory.inventory.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("clientes")
public class Cliente implements Persistable<UUID> {

    @Id
    private UUID id;
    private String nombre;
    private String telefono;
    private String email;
    private String direccion;

    @Column("user_account_id")
    private UUID userAccountId;

    private LocalDateTime createdAt;

    @Transient
    private boolean isNew = false;

    public Cliente() {
    }

    public Cliente(UUID id, String nombre, String telefono, String email,
                   String direccion, LocalDateTime createdAt) {
        this(id, nombre, telefono, email, direccion, null, createdAt);
    }

    public Cliente(UUID id, String nombre, String telefono, String email,
                   String direccion, UUID userAccountId, LocalDateTime createdAt) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.userAccountId = userAccountId;
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

    public String direccion() {
        return direccion;
    }

    public UUID userAccountId() {
        return userAccountId;
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

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public UUID getUserAccountId() {
        return userAccountId;
    }

    public void setUserAccountId(UUID userAccountId) {
        this.userAccountId = userAccountId;
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

    public Cliente withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
