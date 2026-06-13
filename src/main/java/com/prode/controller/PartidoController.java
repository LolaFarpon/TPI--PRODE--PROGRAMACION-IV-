package com.prode.controller;

import com.prode.dto.request.PartidoRequest;
import com.prode.dto.request.ResultadoRequest;
import com.prode.dto.response.PartidoResponse;
import com.prode.service.PartidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidos")
@RequiredArgsConstructor
public class PartidoController {

    private final PartidoService partidoService;

    @GetMapping
    public ResponseEntity<List<PartidoResponse>> listar() {
        return ResponseEntity.ok(partidoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartidoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(partidoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<PartidoResponse> crear(@Valid @RequestBody PartidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partidoService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartidoResponse> modificar(@PathVariable Long id,
                                                      @Valid @RequestBody PartidoRequest request) {
        return ResponseEntity.ok(partidoService.modificar(id, request));
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<PartidoResponse> iniciar(@PathVariable Long id) {
        return ResponseEntity.ok(partidoService.iniciar(id));
    }

    @PatchMapping("/{id}/resultado")
    public ResponseEntity<PartidoResponse> cargarResultado(@PathVariable Long id,
                                                            @Valid @RequestBody ResultadoRequest request) {
        return ResponseEntity.ok(partidoService.cargarResultado(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        partidoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}