package com.prode.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "partidos")
@Getter
@Setter
@NoArgsConstructor
public class Partido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fecha_id", nullable = false)
    private Fecha fecha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_local_id", nullable = false)
    private Equipo equipoLocal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_visitante_id", nullable = false)
    private Equipo equipoVisitante;

    // Hora programada de inicio. Sobre esta se calcula el bloqueo (inicio - 30 min). Siempre en UTC.
    @Column(name = "hora_inicio", nullable = false)
    private Instant horaInicio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPartido estado = EstadoPartido.POR_JUGARSE;

    // null hasta que se carga el resultado real
    @Column(name = "goles_local")
    private Integer golesLocal;

    @Column(name = "goles_visitante")
    private Integer golesVisitante;

    // LOCAL / EMPATE / VISITANTE (se setea al cargar el resultado)
    @Column(length = 10)
    private String ganador;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();
}
