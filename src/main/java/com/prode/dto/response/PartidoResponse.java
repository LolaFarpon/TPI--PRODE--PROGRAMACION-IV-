package com.prode.dto.response;

import com.prode.entity.EstadoPartido;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class PartidoResponse {

    private Long id;
    private Long fechaId;
    private String fechaNombre;
    private Long equipoLocalId;
    private String equipoLocalNombre;
    private Long equipoVisitanteId;
    private String equipoVisitanteNombre;
    private Instant horaInicio;
    private EstadoPartido estado;
    private Integer golesLocal;
    private Integer golesVisitante;
    private String ganador;
}
