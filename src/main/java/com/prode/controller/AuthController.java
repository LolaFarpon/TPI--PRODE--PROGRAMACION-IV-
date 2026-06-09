package com.prode.controller;

import com.prode.dto.request.LoginRequest;
import com.prode.dto.request.RegistroRequest;
import com.prode.dto.response.ApiResponse;
import com.prode.dto.response.AuthResponse;
import com.prode.entity.Usuario;
import com.prode.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/registro
    @PostMapping("/registro")
    public ResponseEntity<ApiResponse> registrar(@Valid @RequestBody RegistroRequest req) {
        Usuario usuario = authService.registrar(req);

        // Devolvemos los datos del usuario SIN la contraseña.
        Map<String, Object> datos = Map.of(
                "id", usuario.getId(),
                "nombreUsuario", usuario.getNombreUsuario(),
                "email", usuario.getEmail(),
                "rol", usuario.getRol().name()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(true, "Usuario registrado", datos));
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse auth = authService.login(req);
        return ResponseEntity.ok(new ApiResponse(true, "Login exitoso", auth));
    }
}
