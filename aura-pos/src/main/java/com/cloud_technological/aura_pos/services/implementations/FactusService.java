package com.cloud_technological.aura_pos.services.implementations;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.cloud_technological.aura_pos.dto.factus.FacturaElectronicaRequest;
import com.cloud_technological.aura_pos.dto.factus.FactusBillDto;
import com.cloud_technological.aura_pos.dto.factus.FactusBillResponseDto;
import com.cloud_technological.aura_pos.dto.factus.FactusCreateBillRequestDto;
import com.cloud_technological.aura_pos.dto.factus.FactusCustomerDto;
import com.cloud_technological.aura_pos.dto.factus.FactusItemDto;
import com.cloud_technological.aura_pos.entity.EmpresaEntity;
import com.cloud_technological.aura_pos.repositories.empresas.EmpresaJPARepository;
import com.cloud_technological.aura_pos.utils.GlobalException;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;

/**
 * FactusService — genera facturas electrónicas en Factus.
 *
 * El token se obtiene a través de FactusTokenService (bean separado)
 * para que los @CircuitBreaker de cada uno operen en su propio proxy AOP.
 *
 * Diagrama de circuit breakers:
 *
 *   VentaFacturaService
 *        │
 *        ▼
 *   FactusService.generarFactura()   ← CB: "factus-bill"
 *        │
 *        ▼
 *   FactusTokenService.obtenerToken() ← CB: "factus-token"
 *        │
 *        ▼
 *   [Factus API]
 */
@Slf4j
@Service
public class FactusService {

    private static final String FACTUS_BILL_URL =
            "https://api-sandbox.factus.com.co/v1/bills/validate";

    private final RestTemplate         restTemplate;
    private final EmpresaJPARepository empresaRepository;
    private final FactusTokenService   factusTokenService;

    public FactusService(RestTemplate restTemplate,
                          EmpresaJPARepository empresaRepository,
                          FactusTokenService factusTokenService) {
        this.restTemplate       = restTemplate;
        this.empresaRepository  = empresaRepository;
        this.factusTokenService = factusTokenService;
    }

    @CircuitBreaker(name = "factus-bill", fallbackMethod = "facturaFallback")
    @Retry(name = "factus-bill")
    public FactusBillDto generarFactura(Integer empresaId,
                                         FacturaElectronicaRequest request) {

        // Token desde bean separado — AOP funciona correctamente
        String token = factusTokenService.obtenerToken(empresaId);

        EmpresaEntity empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new GlobalException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        FactusCreateBillRequestDto dto = buildFactusRequest(empresa, request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<FactusBillResponseDto> response = restTemplate.postForEntity(
                FACTUS_BILL_URL,
                new HttpEntity<>(dto, headers),
                FactusBillResponseDto.class);

        FactusBillResponseDto body = response.getBody();
        if (body == null || !body.isStatus() || body.getData() == null)
            throw new GlobalException(HttpStatus.BAD_GATEWAY,
                    "Factus rechazó la factura: " +
                    (body != null ? body.getMessage() : "sin respuesta"));

        log.info("[Factus Bill] Factura {} | CUFE: {}",
                body.getData().getBill().getNumber(),
                body.getData().getBill().getCufe());

        return body.getData().getBill();
    }

    private FactusCreateBillRequestDto buildFactusRequest(
            EmpresaEntity empresa, FacturaElectronicaRequest req) {

        FactusCreateBillRequestDto dto = new FactusCreateBillRequestDto();
        dto.setNumberingRangeId(empresa.getFactusNumberingRangeId());
        dto.setReferenceCode(req.getNumeroVenta());
        dto.setObservation(req.getObservacion());
        dto.setPaymentMethodCode(req.getMetodoPago());
        dto.setDueDate(req.getFechaVencimiento());

        FactusCustomerDto customer = new FactusCustomerDto();
        customer.setIdentification(req.getClienteDocumento());
        customer.setDv(req.getClienteDv());
        customer.setNames(req.getClienteNombre());
        customer.setEmail(req.getClienteEmail());
        customer.setPhone(req.getClienteTelefono());
        customer.setAddress(req.getClienteDireccion());
        customer.setIdentificationDocumentId(req.getClienteTipoDocumentoFactusId());
        customer.setMunicipalityId(req.getClienteMunicipioId());
        dto.setCustomer(customer);

        List<FactusItemDto> items = req.getItems().stream().map(item -> {
            FactusItemDto i = new FactusItemDto();
            i.setCodeReference(item.getSku() != null ? item.getSku() : "SIN-SKU");
            i.setDescription(item.getNombre());
            i.setQuantity(item.getCantidad());
            i.setPrice(item.getPrecioSinIva());
            i.setDiscountRate(BigDecimal.ZERO);
            i.setTaxRate(item.getIvaPorcentaje());
            i.setUnitMeasureId(70);
            i.setStandardCodeId(1);
            i.setIsExcluded(0);
            return i;
        }).collect(Collectors.toList());
        dto.setItems(items);

        return dto;
    }

    public FactusBillDto facturaFallback(Integer empresaId,
                                          FacturaElectronicaRequest request,
                                          Throwable ex) {
        log.error("[Factus Bill CB ABIERTO] empresa={} error={}",
                empresaId, ex.getMessage());
        return null;
    }
}