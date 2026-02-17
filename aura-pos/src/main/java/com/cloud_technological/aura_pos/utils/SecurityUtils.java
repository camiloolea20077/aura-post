package com.cloud_technological.aura_pos.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class SecurityUtils {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public Integer getEmpresaId() {
        String token = getTokenFromSecurityContext();
        if (token != null) {
            return extractEmpresaId(token);
        }
        return null;
    }

    public Long getSucursalId() {
        String token = getTokenFromSecurityContext();
        if (token != null) {
            return extractSucursalId(token);
        }
        return null;
    }

    public String getRol() {
        String token = getTokenFromSecurityContext();
        if (token != null) {
            return extractRol(token);
        }
        return null;
    }

    private String getTokenFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }
        return null;
    }

    private Integer extractEmpresaId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("empresaId", Integer.class);
    }

    private Long extractSucursalId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("sucursalId", Long.class);
    }

    private String extractRol(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("rol", String.class);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
