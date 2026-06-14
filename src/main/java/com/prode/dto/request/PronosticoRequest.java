package com.prode.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PronosticoRequest {

    @NotNull(message = "Los goles del local son obligatorios")
    @Min(value = 0, message = "Los goles no pueden ser negativos")
    private Integer golesLocal;

    @NotNull(message = "Los goles del visitante son obligatorios")
    @Min(value = 0, message = "Los goles no pueden ser negativos")
    private Integer golesVisitante;
}
