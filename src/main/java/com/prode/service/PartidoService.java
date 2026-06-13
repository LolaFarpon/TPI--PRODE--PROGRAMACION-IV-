package com.prode.service;

import com.prode.dto.request.PartidoRequest;
import com.prode.dto.request.ResultadoRequest;
import com.prode.dto.response.PartidoResponse;
import com.prode.entity.Equipo;
import com.prode.entity.EstadoPartido;
import com.prode.entity.Fecha;
import com.prode.entity.Partido;
import com.prode.exception.RecursoNoEncontradoException;
import com.prode.exception.SolicitudInvalidaException;
import com.prode.repository.EquipoRepository;
import com.prode.repository.FechaRepository;
import com.prode.repository.PartidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartidoService {

    private final PartidoRepository partidoRepository;
    private final FechaRepository fechaRepository;
    private final EquipoRepository equipoRepository;
    private final FechaService fechaService;
    private final MotorPuntosService motorPuntosService;

    public List<PartidoResponse> listarTodos() {
        return partidoRepository.findAllByOrderByHoraInicioAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PartidoResponse obtenerPorId(Long id) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado con id: " + id));
        return toResponse(partido);
    }

    public PartidoResponse crear(PartidoRequest request) {
        validarEquiposDistintos(request);

        Fecha fecha = fechaRepository.findById(request.getFechaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Fecha no encontrada con id: " + request.getFechaId()));
        Equipo equipoLocal = equipoRepository.findById(request.getEquipoLocalId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo local no encontrado con id: " + request.getEquipoLocalId()));
        Equipo equipoVisitante = equipoRepository.findById(request.getEquipoVisitanteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo visitante no encontrado con id: " + request.getEquipoVisitanteId()));

        Partido partido = new Partido();
        partido.setFecha(fecha);
        partido.setEquipoLocal(equipoLocal);
        partido.setEquipoVisitante(equipoVisitante);
        partido.setHoraInicio(request.getHoraInicio());
        partido.setEstado(EstadoPartido.POR_JUGARSE);

        Partido guardado = partidoRepository.save(partido);
        fechaService.recalcularEstadoRound(fecha.getId());

        return toResponse(guardado);
    }

    public PartidoResponse modificar(Long id, PartidoRequest request) {
        validarEquiposDistintos(request);

        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado con id: " + id));

        Fecha fechaAnterior = partido.getFecha();

        Fecha fecha = fechaRepository.findById(request.getFechaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Fecha no encontrada con id: " + request.getFechaId()));
        Equipo equipoLocal = equipoRepository.findById(request.getEquipoLocalId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo local no encontrado con id: " + request.getEquipoLocalId()));
        Equipo equipoVisitante = equipoRepository.findById(request.getEquipoVisitanteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo visitante no encontrado con id: " + request.getEquipoVisitanteId()));

        partido.setFecha(fecha);
        partido.setEquipoLocal(equipoLocal);
        partido.setEquipoVisitante(equipoVisitante);
        partido.setHoraInicio(request.getHoraInicio());

        Partido guardado = partidoRepository.save(partido);

        // Recalcular tanto la fecha anterior (si cambió) como la nueva
        if (!fechaAnterior.getId().equals(fecha.getId())) {
            fechaService.recalcularEstadoRound(fechaAnterior.getId());
        }
        fechaService.recalcularEstadoRound(fecha.getId());

        return toResponse(guardado);
    }

    /**
     * PATCH /start -> pasa el partido a EN_JUEGO.
     */
    public PartidoResponse iniciar(Long id) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado con id: " + id));

        if (partido.getEstado() != EstadoPartido.POR_JUGARSE) {
            throw new SolicitudInvalidaException("Solo se puede iniciar un partido que esta POR_JUGARSE");
        }

        partido.setEstado(EstadoPartido.EN_JUEGO);
        Partido guardado = partidoRepository.save(partido);

        fechaService.recalcularEstadoRound(partido.getFecha().getId());

        return toResponse(guardado);
    }

    /**
     * Carga el resultado de un partido EN_JUEGO, calcula el ganador,
     * lo pasa a FINALIZADO y dispara el reparto de puntos.
     */
    public PartidoResponse cargarResultado(Long id, ResultadoRequest request) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado con id: " + id));

        if (partido.getEstado() != EstadoPartido.EN_JUEGO) {
            throw new SolicitudInvalidaException("Solo se puede cargar el resultado de un partido EN_JUEGO");
        }

        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());

        if (request.getGolesLocal() > request.getGolesVisitante()) {
            partido.setGanador("LOCAL");
        } else if (request.getGolesLocal() < request.getGolesVisitante()) {
            partido.setGanador("VISITANTE");
        } else {
            partido.setGanador("EMPATE");
        }

        partido.setEstado(EstadoPartido.FINALIZADO);
        Partido guardado = partidoRepository.save(partido);

        motorPuntosService.procesarPuntos(guardado);

        fechaService.recalcularEstadoRound(guardado.getFecha().getId());

        return toResponse(guardado);
    }

    public void eliminar(Long id) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado con id: " + id));

        Long fechaId = partido.getFecha().getId();
        partidoRepository.deleteById(id);

        fechaService.recalcularEstadoRound(fechaId);
    }

    private void validarEquiposDistintos(PartidoRequest request) {
        if (request.getEquipoLocalId().equals(request.getEquipoVisitanteId())) {
            throw new SolicitudInvalidaException("El equipo local y el equipo visitante no pueden ser el mismo");
        }
    }

    private PartidoResponse toResponse(Partido partido) {
        PartidoResponse response = new PartidoResponse();
        response.setId(partido.getId());
        response.setFechaId(partido.getFecha().getId());
        response.setFechaNombre(partido.getFecha().getNombre());
        response.setEquipoLocalId(partido.getEquipoLocal().getId());
        response.setEquipoLocalNombre(partido.getEquipoLocal().getNombre());
        response.setEquipoVisitanteId(partido.getEquipoVisitante().getId());
        response.setEquipoVisitanteNombre(partido.getEquipoVisitante().getNombre());
        response.setHoraInicio(partido.getHoraInicio());
        response.setEstado(partido.getEstado());
        response.setGolesLocal(partido.getGolesLocal());
        response.setGolesVisitante(partido.getGolesVisitante());
        response.setGanador(partido.getGanador());
        return response;
    }
}