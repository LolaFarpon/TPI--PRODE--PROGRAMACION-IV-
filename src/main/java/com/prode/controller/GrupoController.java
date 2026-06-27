package com.prode.controller;

import com.prode.dto.request.CrearGrupoRequest;
import com.prode.dto.request.UnirseGrupoRequest;
import com.prode.dto.response.GrupoResponse;
import com.prode.dto.response.LeaderboardEntryResponse;
import com.prode.service.GrupoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;

    // POST /api/grupos
    @PostMapping
    public ResponseEntity<GrupoResponse> crearGrupo(
            @Valid @RequestBody CrearGrupoRequest request,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grupoService.crearGrupo(request, principal.getUsername()));
    }

    // POST /api/grupos/unirse
    @PostMapping("/unirse")
    public ResponseEntity<GrupoResponse> unirseAGrupo(
            @Valid @RequestBody UnirseGrupoRequest request,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(grupoService.unirseAGrupo(request, principal.getUsername()));
    }

    // GET /api/grupos/mis-grupos
    @GetMapping("/mis-grupos")
    public ResponseEntity<List<GrupoResponse>> misGrupos(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(grupoService.obtenerMisGrupos(principal.getUsername()));
    }

    // GET /api/grupos/{id}/ranking
    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<LeaderboardEntryResponse>> rankingGrupo(
            @PathVariable Long id) {

        return ResponseEntity.ok(grupoService.obtenerRankingGrupo(id));
    }
}
