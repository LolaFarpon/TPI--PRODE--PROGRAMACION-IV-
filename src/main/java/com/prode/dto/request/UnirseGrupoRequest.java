package com.prode.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnirseGrupoRequest {

    @NotBlank(message = "El código de invitación no puede estar vacío")
    private String codigoInvitacion;
}