package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Table("community_events")
public class CommunityEvent implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID artesanoId;
    private String artesanoNombre;
    private String organizacion;
    private String nombre;
    private String localidad;
    private String direccionExacta;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String hora;
    private String descripcion;
    private String estado;
    private String reviewComment;
    private UUID reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private boolean isNew = false;

    public CommunityEvent() {
    }

    public CommunityEvent(UUID id, UUID artesanoId, String artesanoNombre, String organizacion,
                          String nombre, String localidad, String direccionExacta,
                          LocalDate fechaInicio, LocalDate fechaFin, String hora,
                          String descripcion, String estado, LocalDateTime createdAt,
                          LocalDateTime updatedAt) {
        this.id = id;
        this.artesanoId = artesanoId;
        this.artesanoNombre = artesanoNombre;
        this.organizacion = organizacion;
        this.nombre = nombre;
        this.localidad = localidad;
        this.direccionExacta = direccionExacta;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.hora = hora;
        this.descripcion = descripcion;
        this.estado = estado != null ? estado : "PENDIENTE";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public UUID id() {
        return id;
    }

    public UUID artesanoId() {
        return artesanoId;
    }

    public String artesanoNombre() {
        return artesanoNombre;
    }

    public String organizacion() {
        return organizacion;
    }

    public String nombre() {
        return nombre;
    }

    public String localidad() {
        return localidad;
    }

    public String direccionExacta() {
        return direccionExacta;
    }

    public LocalDate fechaInicio() {
        return fechaInicio;
    }

    public LocalDate fechaFin() {
        return fechaFin;
    }

    public String hora() {
        return hora;
    }

    public String descripcion() {
        return descripcion;
    }

    public String estado() {
        return estado;
    }

    public String reviewComment() {
        return reviewComment;
    }

    public UUID reviewedBy() {
        return reviewedBy;
    }

    public LocalDateTime reviewedAt() {
        return reviewedAt;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public LocalDateTime updatedAt() {
        return updatedAt;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getArtesanoId() {
        return artesanoId;
    }

    public void setArtesanoId(UUID artesanoId) {
        this.artesanoId = artesanoId;
    }

    public String getArtesanoNombre() {
        return artesanoNombre;
    }

    public void setArtesanoNombre(String artesanoNombre) {
        this.artesanoNombre = artesanoNombre;
    }

    public String getOrganizacion() {
        return organizacion;
    }

    public void setOrganizacion(String organizacion) {
        this.organizacion = organizacion;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getLocalidad() {
        return localidad;
    }

    public void setLocalidad(String localidad) {
        this.localidad = localidad;
    }

    public String getDireccionExacta() {
        return direccionExacta;
    }

    public void setDireccionExacta(String direccionExacta) {
        this.direccionExacta = direccionExacta;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getHora() {
        return hora;
    }

    public void setHora(String hora) {
        this.hora = hora;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }

    public UUID getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(UUID reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    public CommunityEvent withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
