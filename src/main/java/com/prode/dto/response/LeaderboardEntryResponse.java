package com.prode.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
public class LeaderboardEntryResponse {

    private Long usuarioId;
    private String nombreUsuario;
    private Long puntosTotales;
    private Long exactos;
    private Instant creadoEn;
    private Integer posicion;

    // Constructor que usa la query JPQL (sin posicion)
    public LeaderboardEntryResponse(Long usuarioId, String nombreUsuario,
                                    Long puntosTotales, Long exactos,
                                    Instant creadoEn) {
        this.usuarioId     = usuarioId;
        this.nombreUsuario = nombreUsuario;
        this.puntosTotales = puntosTotales;
        this.exactos       = exactos;
        this.creadoEn      = creadoEn;
    }
}