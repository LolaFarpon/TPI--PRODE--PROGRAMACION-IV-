package com.prode.exception;

// 403 - autenticado pero sin permiso para esta accion
public class AccesoDenegadoException extends RuntimeException {
    public AccesoDenegadoException(String mensaje) {
        super(mensaje);
    }
}
