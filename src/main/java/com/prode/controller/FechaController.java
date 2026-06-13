package com.prode.controller;

import com.prode.dto.request.FechaRequest;
import com.prode.dto.response.FechaResponse;
import com.prode.service.FechaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fechas")
@RequiredArgsConstructor
public class FechaController {

    private final FechaService fechaService;

    @GetMapping
    public ResponseEntity<List<FechaResponse>> listar() {
        return ResponseEntity.ok(fechaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FechaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(fechaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<FechaResponse> crear(@Valid @RequestBody FechaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fechaService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FechaResponse> modificar(@PathVariable Long id,
                                                    @Valid @RequestBody FechaRequest request) {
        return ResponseEntity.ok(fechaService.modificar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        fechaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}