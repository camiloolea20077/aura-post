package com.cloud_technological.aura_pos.services.implementations;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloud_technological.aura_pos.dto.producto_presentacion.CreateProductoPresentacionDto;
import com.cloud_technological.aura_pos.dto.producto_presentacion.ProductoPresentacionDto;
import com.cloud_technological.aura_pos.dto.producto_presentacion.ProductoPresentacionTableDto;
import com.cloud_technological.aura_pos.dto.producto_presentacion.UpdateProductoPresentacionDto;
import com.cloud_technological.aura_pos.entity.ProductoEntity;
import com.cloud_technological.aura_pos.entity.ProductoPresentacionEntity;
import com.cloud_technological.aura_pos.mappers.ProductoPresentacionMapper;
import com.cloud_technological.aura_pos.repositories.producto_presentacion.ProductoPresentacionJPARepository;
import com.cloud_technological.aura_pos.repositories.producto_presentacion.ProductoPresentacionQueryRepository;
import com.cloud_technological.aura_pos.repositories.productos.ProductoJPARepository;
import com.cloud_technological.aura_pos.services.ProductoPresentacionService;
import com.cloud_technological.aura_pos.utils.GlobalException;
import com.cloud_technological.aura_pos.utils.PageableDto;

import jakarta.transaction.Transactional;

@Service
public class ProductoPresentacionServiceImpl implements ProductoPresentacionService {

    private final ProductoPresentacionQueryRepository presentacionRepository;
    private final ProductoPresentacionJPARepository presentacionJPARepository;
    private final ProductoJPARepository productoJPARepository;
    private final ProductoPresentacionMapper presentacionMapper;

    @Autowired
    public ProductoPresentacionServiceImpl(
            ProductoPresentacionQueryRepository presentacionRepository,
            ProductoPresentacionJPARepository presentacionJPARepository,
            ProductoJPARepository productoJPARepository,
            ProductoPresentacionMapper presentacionMapper) {
        this.presentacionRepository = presentacionRepository;
        this.presentacionJPARepository = presentacionJPARepository;
        this.productoJPARepository = productoJPARepository;
        this.presentacionMapper = presentacionMapper;
    }

    @Override
    public PageImpl<ProductoPresentacionTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        return presentacionRepository.listar(pageable, empresaId);
    }

    @Override
    public ProductoPresentacionDto obtenerPorId(Long id, Integer empresaId) {
        ProductoPresentacionEntity entity = presentacionJPARepository.findByIdAndProductoEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Presentación no encontrada"));
        return presentacionMapper.toDto(entity);
    }

    @Override
    public List<ProductoPresentacionTableDto> listarPorProducto(Long productoId) {
        return presentacionRepository.listarPorProducto(productoId);
    }

    @Override
    @Transactional
    public ProductoPresentacionDto crear(CreateProductoPresentacionDto dto, Integer empresaId) {
        if (dto.getCodigoBarras() != null && !dto.getCodigoBarras().isBlank() &&
                presentacionRepository.existeCodigoBarras(dto.getCodigoBarras()))
            throw new GlobalException(HttpStatus.BAD_REQUEST, "El código de barras ya está registrado");

        ProductoEntity producto = productoJPARepository.findByIdAndEmpresaId(dto.getProductoId(), empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.BAD_REQUEST, "Producto no encontrado"));

        ProductoPresentacionEntity entity = presentacionMapper.toEntity(dto);
        entity.setProducto(producto);

        return presentacionMapper.toDto(presentacionJPARepository.save(entity));
    }

    @Override
    @Transactional
    public ProductoPresentacionDto actualizar(Long id, UpdateProductoPresentacionDto dto, Integer empresaId) {
        ProductoPresentacionEntity entity = presentacionJPARepository.findByIdAndProductoEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Presentación no encontrada"));

        if (dto.getCodigoBarras() != null && !dto.getCodigoBarras().isBlank() &&
                presentacionRepository.existeCodigoBarrasExcluyendo(dto.getCodigoBarras(), id))
            throw new GlobalException(HttpStatus.BAD_REQUEST, "El código de barras ya está en uso");

        presentacionMapper.updateEntityFromDto(dto, entity);
        return presentacionMapper.toDto(presentacionJPARepository.save(entity));
    }

    @Override
    @Transactional
    public void eliminar(Long id, Integer empresaId) {
        ProductoPresentacionEntity entity = presentacionJPARepository.findByIdAndProductoEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Presentación no encontrada"));

        entity.setActivo(false);
        presentacionJPARepository.save(entity);
    }
}