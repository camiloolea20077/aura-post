package com.cloud_technological.aura_pos.dto.factus;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FactusCreateBillRequestDto {
        
    @JsonProperty("numbering_range_id")
    private Integer numberingRangeId;

    @JsonProperty("reference_code")
    private String referenceCode;          // número interno del sistema

    @JsonProperty("observation")
    private String observation;

    @JsonProperty("payment_method_code")
    private String paymentMethodCode;      // "10"=Efectivo, "42"=Transferencia, "20"=Cheque

    @JsonProperty("due_date")
    private String dueDate;               // "YYYY-MM-DD"

    private FactusCustomerDto customer;

    private List<FactusItemDto> items;
}
