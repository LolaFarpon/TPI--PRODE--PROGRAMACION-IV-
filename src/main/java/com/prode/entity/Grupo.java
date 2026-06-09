package com.prode.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "grupos")
@Getter
@Setter
@NoArgsConstructor
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "codigo_invitacion", nullable = false, unique = true, length = 10)
    private String codigoInvitacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "propietario_id", nullable = false)
    private Usuario propietario;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();
}
