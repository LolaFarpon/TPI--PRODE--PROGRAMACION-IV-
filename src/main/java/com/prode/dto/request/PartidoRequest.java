package com.prode.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class PartidoRequest {

    @NotNull(message = "La fecha (jornada) es obligatoria")
    private Long fechaId;

    @NotNull(message = "El equipo local es obligatorio")
    private Long equipoLocalId;

    @NotNull(message = "El equipo visitante es obligatorio")
    private Long equipoVisitanteId;

    @NotNull(message = "La hora de inicio es obligatoria")
    private Instant horaInicio;
}
