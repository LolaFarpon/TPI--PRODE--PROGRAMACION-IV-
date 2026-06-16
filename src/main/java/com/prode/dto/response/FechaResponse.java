package com.prode.dto.response;

import com.prode.entity.EstadoFecha;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FechaResponse {

    private Long id;
    private String nombre;
    private EstadoFecha estado;
}