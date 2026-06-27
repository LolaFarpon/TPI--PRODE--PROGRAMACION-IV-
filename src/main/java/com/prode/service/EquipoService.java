package com.prode.service;

import com.prode.dto.request.EquipoRequest;
import com.prode.dto.response.EquipoResponse;
import com.prode.entity.Equipo;
import com.prode.exception.ConflictoException;
import com.prode.exception.RecursoNoEncontradoException;
import com.prode.repository.EquipoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository equipoRepository;

    public List<EquipoResponse> listarTodos() {
        return equipoRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EquipoResponse obtenerPorId(Long id) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));
        return toResponse(equipo);
    }

    public EquipoResponse crear(EquipoRequest request) {
        if (equipoRepository.existsByNombre(request.getNombre())) {
            throw new ConflictoException("Ya existe un equipo con el nombre: " + request.getNombre());
        }
        Equipo equipo = new Equipo();
        equipo.setNombre(request.getNombre());
        return toResponse(equipoRepository.save(equipo));
    }

    public EquipoResponse modificar(Long id, EquipoRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));
        if (!equipo.getNombre().equals(request.getNombre()) &&
                equipoRepository.existsByNombre(request.getNombre())) {
            throw new ConflictoException("Ya existe un equipo con el nombre: " + request.getNombre());
        }
        equipo.setNombre(request.getNombre());
        return toResponse(equipoRepository.save(equipo));
    }

    public void eliminar(Long id) {
        if (!equipoRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("Equipo no encontrado con id: " + id);
        }
        equipoRepository.deleteById(id);
    }

    private EquipoResponse toResponse(Equipo equipo) {
        EquipoResponse response = new EquipoResponse();
        response.setId(equipo.getId());
        response.setNombre(equipo.getNombre());
        return response;
    }
}
