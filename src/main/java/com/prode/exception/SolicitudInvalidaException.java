package com.prode.exception;

// 400 - violacion de regla de negocio (bloqueo de 30 min, estado incorrecto, etc.)
public class SolicitudInvalidaException extends RuntimeException {
    public SolicitudInvalidaException(String mensaje) {
        super(mensaje);
    }
}
