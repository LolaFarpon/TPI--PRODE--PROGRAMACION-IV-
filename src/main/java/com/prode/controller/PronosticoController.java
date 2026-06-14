package com.prode.controller;

import com.prode.dto.request.PronosticoRequest;
import com.prode.dto.response.ApiResponse;
import com.prode.entity.Pronostico;
import com.prode.repository.UsuarioRepository;
import com.prode.service.PronosticoService;
import com.prode.exception.RecursoNoEncontradoException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pronosticos")
public class PronosticoController {

    private final PronosticoService pronosticoService;
    private final UsuarioRepository usuarioRepository;

    public PronosticoController(PronosticoService pronosticoService,
                                UsuarioRepository usuarioRepository) {
        this.pronosticoService = pronosticoService;
        this.usuarioRepository = usuarioRepository;
    }

    // El login es por email; UserDetails.getUsername() devuelve el email.
    private Long usuarioActualId(UserDetails principal) {
        return usuarioRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"))
                .getId();
    }

    // Arma una respuesta JSON del pronóstico sin exponer toda la entidad.
    private Map<String, Object> aDto(Pronostico p) {
        return Map.of(
                "id", p.getId(),
                "partidoId", p.getPartido().getId(),
                "golesLocal", p.getGolesLocalPron(),
                "golesVisitante", p.getGolesVisitantePron(),
                "puntosObtenidos", p.getPuntosObtenidos()
        );
    }

    // PUT /api/pronosticos/{partidoId}  — crear o modificar (HU-16)
    @PutMapping("/{partidoId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse> guardar(
            @PathVariable Long partidoId,
            @Valid @RequestBody PronosticoRequest req,
            @AuthenticationPrincipal UserDetails principal) {

        Pronostico p = pronosticoService.guardar(partidoId, req, usuarioActualId(principal));
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ApiResponse(true, "Pronóstico guardado", aDto(p)));
    }

    // GET /api/pronosticos/mios  — mis pronósticos (HU-17)
    @GetMapping("/mios")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse> misPronosticos(
            @AuthenticationPrincipal UserDetails principal) {

        List<Map<String, Object>> datos = pronosticoService
                .misPronosticos(usuarioActualId(principal)).stream()
                .map(this::aDto)
                .toList();
        return ResponseEntity.ok(new ApiResponse(true, "OK", datos));
    }

    // GET /api/pronosticos/partido/{partidoId}  — pronósticos de terceros (HU-18)
    @GetMapping("/partido/{partidoId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse> deTerceros(
            @PathVariable Long partidoId,
            @AuthenticationPrincipal UserDetails principal) {

        List<Map<String, Object>> datos = pronosticoService
                .pronosticosDeTerceros(partidoId, usuarioActualId(principal)).stream()
                .map(this::aDto)
                .toList();
        return ResponseEntity.ok(new ApiResponse(true, "OK", datos));
    }
}
