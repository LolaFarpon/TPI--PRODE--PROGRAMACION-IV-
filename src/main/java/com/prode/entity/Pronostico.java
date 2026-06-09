package com.prode.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "pronosticos",
    uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "partido_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class Pronostico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partido_id", nullable = false)
    private Partido partido;

    @Column(name = "goles_local_pron", nullable = false)
    private int golesLocalPron;

    @Column(name = "goles_visitante_pron", nullable = false)
    private int golesVisitantePron;

    @Column(name = "puntos_obtenidos", nullable = false)
    private int puntosObtenidos = 0;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();
}
