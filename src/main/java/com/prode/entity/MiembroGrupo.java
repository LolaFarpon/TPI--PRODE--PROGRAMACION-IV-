package com.prode.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "miembros_grupo",
    uniqueConstraints = @UniqueConstraint(columnNames = {"grupo_id", "usuario_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class MiembroGrupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "unido_en", nullable = false)
    private Instant unidoEn = Instant.now();
}
