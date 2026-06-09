package com.prode.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

// "Fecha" = Jornada (RF3). Su estado es derivado: se recalcula segun sus partidos.
@Entity
@Table(name = "fechas")
@Getter
@Setter
@NoArgsConstructor
public class Fecha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoFecha estado = EstadoFecha.PROGRAMADA;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();
}
