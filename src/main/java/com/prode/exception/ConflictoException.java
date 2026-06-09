package com.prode.exception;

// 409 - conflicto (duplicado, estado invalido, dependencias, etc.)
public class ConflictoException extends RuntimeException {
    public ConflictoException(String mensaje) {
        super(mensaje);
    }
}
