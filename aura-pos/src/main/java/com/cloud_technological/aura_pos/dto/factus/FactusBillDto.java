package com.cloud_technological.aura_pos.dto.factus;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FactusBillDto {
    private Long id;
    private String number;                // número de la factura
    private String cufe;                  // código único DIAN
    private String qr;                    // URL QR DIAN
    @JsonProperty("issue_date")
    private String issueDate;
    @JsonProperty("pdf_download_link")
    private String pdfDownloadLink;
    @JsonProperty("xml_download_link")
    private String xmlDownloadLink;
}
