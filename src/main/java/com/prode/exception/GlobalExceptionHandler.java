package com.prode.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// Formato estandar de error para TODA la API: { "error": "mensaje" }
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<Map<String, String>> construir(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(Map.of("error", mensaje));
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<Map<String, String>> noEncontrado(RecursoNoEncontradoException ex) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<Map<String, String>> conflicto(ConflictoException ex) {
        return construir(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<Map<String, String>> accesoDenegado(AccesoDenegadoException ex) {
        return construir(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<Map<String, String>> solicitudInvalida(SolicitudInvalidaException ex) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // Errores de @Valid (campos faltantes / invalidos) -> 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacion(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Datos invalidos");
        return construir(HttpStatus.BAD_REQUEST, msg);
    }

    // Credenciales incorrectas (email o contrasena mal) -> 401
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Map<String, String>> credencialesInvalidas(
            org.springframework.security.core.AuthenticationException ex) {
        return construir(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
    }

    // Acceso denegado por falta de permisos (@PreAuthorize) -> 403
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> accesoProhibido(
            org.springframework.security.access.AccessDeniedException ex) {
        return construir(HttpStatus.FORBIDDEN, "Acceso denegado: no tenés permisos para esta operación");
    }

    // Red de seguridad: cualquier excepcion no contemplada -> 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> generica(Exception ex) {
        log.error("Error no controlado: ", ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");
    }
}