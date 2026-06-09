package com.prode.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// Envoltorio estandar de respuestas: { exito, mensaje, datos }
@Getter
@Setter
@AllArgsConstructor
public class ApiResponse {
    private boolean exito;
    private String mensaje;
    private Object datos;
}
