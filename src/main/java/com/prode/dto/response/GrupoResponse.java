package com.prode.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class GrupoResponse {

    private Long id;
    private String nombre;
    private String codigoInvitacion;
    private String propietarioNombreUsuario;
    private Instant creadoEn;
}