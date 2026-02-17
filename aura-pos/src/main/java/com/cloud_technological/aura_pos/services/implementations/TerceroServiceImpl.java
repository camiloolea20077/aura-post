package com.cloud_technological.aura_pos.services.implementations;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloud_technological.aura_pos.dto.terceros.CreateTerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroTableDto;
import com.cloud_technological.aura_pos.dto.terceros.UpdateTerceroDto;
import com.cloud_technological.aura_pos.entity.EmpresaEntity;
import com.cloud_technological.aura_pos.entity.TerceroEntity;
import com.cloud_technological.aura_pos.mappers.TerceroMapper;
import com.cloud_technological.aura_pos.repositories.empresas.EmpresaJPARepository;
import com.cloud_technological.aura_pos.repositories.terceros.TerceroJPARepository;
import com.cloud_technological.aura_pos.repositories.terceros.TerceroQueryRepository;
import com.cloud_technological.aura_pos.services.ITerceroService;
import com.cloud_technological.aura_pos.utils.GlobalException;
import com.cloud_technological.aura_pos.utils.PageableDto;


@Service
public class TerceroServiceImpl implements ITerceroService {

    private final TerceroJPARepository terceroJPARepository;
    private final TerceroQueryRepository terceroQueryRepository;
    private final EmpresaJPARepository empresaJPARepository;
    private final TerceroMapper terceroMapper;

    @Autowired
    public TerceroServiceImpl(TerceroJPARepository terceroJPARepository, 
                               TerceroQueryRepository terceroQueryRepository,
                               EmpresaJPARepository empresaJPARepository,
                               TerceroMapper terceroMapper) {
        this.terceroJPARepository = terceroJPARepository;
        this.terceroQueryRepository = terceroQueryRepository;
        this.empresaJPARepository = empresaJPARepository;
        this.terceroMapper = terceroMapper;
    }
    @Override
    public PageImpl<TerceroTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        return terceroQueryRepository.listar(pageable, empresaId);
    }

    @Override
    @Transactional
    public TerceroDto crear(CreateTerceroDto dto, Integer empresaId) {
        // 1. Validar duplicado
        if (terceroQueryRepository.existsByNumeroDocumentoAndEmpresaId(dto.getNumeroDocumento(), empresaId)) {
            throw new GlobalException(HttpStatus.BAD_REQUEST, "Ya existe un tercero con el documento " + dto.getNumeroDocumento());
        }

        // 2. Buscar la empresa en la base de datos
        EmpresaEntity empresa = empresaJPARepository.findById(empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        // 3. Mapear y asignar Empresa
        TerceroEntity entity = terceroMapper.toEntity(dto);
        entity.setEmpresa(empresa);
        entity.setCreated_at(LocalDateTime.now());
        entity.setUpdated_at(LocalDateTime.now());

        // 4. Guardar
        return terceroMapper.toDto(terceroJPARepository.save(entity));
    }

    @Override
    @Transactional
    public boolean actualizar(UpdateTerceroDto dto, Integer empresaId) {
        // 1. Buscar por el ID que viene DENTRO del DTO
        TerceroEntity entity = terceroJPARepository.findByIdAndEmpresaId(dto.getId(), empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Tercero no encontrado"));

        // 2. Validación de documento duplicado (si cambió)
        if (!entity.getNumeroDocumento().equals(dto.getNumeroDocumento())) {
            if (terceroQueryRepository.existsByNumeroDocumentoAndEmpresaIdAndIdNot(dto.getNumeroDocumento(), empresaId, dto.getId())) {
                throw new GlobalException(HttpStatus.BAD_REQUEST, "El documento ya pertenece a otro tercero");
            }
        }

        // 3. Mapper específico de Update
        terceroMapper.updateEntityFromDto(dto, entity);
        entity.setUpdated_at(LocalDateTime.now());

        terceroJPARepository.save(entity);
        return true;
    }

    @Override
    @Transactional
    public boolean eliminar(Long id, Integer empresaId) {
        // 1. Buscar (Soft Delete)
        TerceroEntity entity = terceroJPARepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Tercero no encontrado"));

        // 2. Marcar como borrado
        entity.setDeleted_at(LocalDateTime.now());
        entity.setActivo(false);
        
        terceroJPARepository.save(entity);
        return true;
    }

    @Override
    public TerceroDto obtenerPorId(Long id, Integer empresaId) {
        TerceroEntity entity = terceroJPARepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Tercero no encontrado"));
        return terceroMapper.toDto(entity);
    }
}
