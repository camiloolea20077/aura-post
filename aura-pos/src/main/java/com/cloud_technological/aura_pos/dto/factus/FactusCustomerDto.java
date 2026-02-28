package com.cloud_technological.aura_pos.dto.factus;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FactusCustomerDto {
    @JsonProperty("identification")
    private String identification;         // NIT o cédula

    @JsonProperty("dv")
    private String dv;                     // dígito verificador (solo NIT)

    @JsonProperty("company")
    private String company;               // razón social (si es empresa)

    @JsonProperty("trade_name")
    private String tradeName;

    @JsonProperty("names")
    private String names;                 // nombres (si es persona natural)

    @JsonProperty("address")
    private String address;

    @JsonProperty("email")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("identification_document_id")
    private Integer identificationDocumentId; // 3=Cédula, 6=NIT, 13=Pasaporte

    @JsonProperty("municipality_id")
    private Integer municipalityId;        // ID del municipio en Factus
}
