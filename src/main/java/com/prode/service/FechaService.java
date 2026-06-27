package com.prode.service;

import com.prode.dto.request.FechaRequest;
import com.prode.dto.response.FechaResponse;
import com.prode.entity.EstadoFecha;
import com.prode.entity.EstadoPartido;
import com.prode.entity.Fecha;
import com.prode.entity.Partido;
import com.prode.exception.ConflictoException;
import com.prode.exception.RecursoNoEncontradoException;
import com.prode.repository.FechaRepository;
import com.prode.repository.PartidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FechaService {

    private final FechaRepository fechaRepository;
    private final PartidoRepository partidoRepository;

    public List<FechaResponse> listarTodas() {
        return fechaRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public FechaResponse obtenerPorId(Long id) {
        Fecha fecha = fechaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Fecha no encontrada con id: " + id));
        return toResponse(fecha);
    }

    public FechaResponse crear(FechaRequest request) {
        if (fechaRepository.existsByNombre(request.getNombre())) {
            throw new ConflictoException("Ya existe una fecha con el nombre: " + request.getNombre());
        }
        Fecha fecha = new Fecha();
        fecha.setNombre(request.getNombre());
        fecha.setEstado(EstadoFecha.PROGRAMADA);
        return toResponse(fechaRepository.save(fecha));
    }

    public FechaResponse modificar(Long id, FechaRequest request) {
        Fecha fecha = fechaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Fecha no encontrada con id: " + id));
        if (!fecha.getNombre().equals(request.getNombre()) &&
                fechaRepository.existsByNombre(request.getNombre())) {
            throw new ConflictoException("Ya existe una fecha con el nombre: " + request.getNombre());
        }
        fecha.setNombre(request.getNombre());
        return toResponse(fechaRepository.save(fecha));
    }

    public void eliminar(Long id) {
        if (!fechaRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("Fecha no encontrada con id: " + id);
        }
        fechaRepository.deleteById(id);
    }

    /**
     * Recalcula el estado de la Fecha en base al estado de sus partidos.
     * - Sin partidos o todos POR_JUGARSE -> PROGRAMADA
     * - Todos FINALIZADO -> FINALIZADA
     * - Cualquier otro caso -> EN_JUEGO
     */
    public void recalcularEstadoRound(Long fechaId) {
        Fecha fecha = fechaRepository.findById(fechaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Fecha no encontrada con id: " + fechaId));

        List<Partido> partidos = partidoRepository.findByFechaId(fechaId);

        EstadoFecha nuevoEstado;

        if (partidos.isEmpty() ||
                partidos.stream().allMatch(p -> p.getEstado() == EstadoPartido.POR_JUGARSE)) {
            nuevoEstado = EstadoFecha.PROGRAMADA;
        } else if (partidos.stream().allMatch(p -> p.getEstado() == EstadoPartido.FINALIZADO)) {
            nuevoEstado = EstadoFecha.FINALIZADA;
        } else {
            nuevoEstado = EstadoFecha.EN_JUEGO;
        }

        if (fecha.getEstado() != nuevoEstado) {
            fecha.setEstado(nuevoEstado);
            fechaRepository.save(fecha);
        }
    }

    private FechaResponse toResponse(Fecha fecha) {
        FechaResponse response = new FechaResponse();
        response.setId(fecha.getId());
        response.setNombre(fecha.getNombre());
        response.setEstado(fecha.getEstado());
        return response;
    }
}