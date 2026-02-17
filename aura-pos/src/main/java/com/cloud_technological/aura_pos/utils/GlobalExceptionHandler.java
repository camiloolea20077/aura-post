package com.cloud_technological.aura_pos.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import com.fasterxml.jackson.databind.JsonMappingException;

@ControllerAdvice()
public class GlobalExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(GlobalException.class)
	public ResponseEntity<?> handleGlobalException(GlobalException ex, WebRequest request) {
		ApiResponse<Object> response = new ApiResponse<>(ex.getStatus().value(), ex.getMessage(), true, null);
		return new ResponseEntity<>(response, ex.getStatus());
	}

	// Manejo de la excepción RuntimeException
	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<?> handleRuntimeException(RuntimeException ex, WebRequest request) {
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.CONFLICT.value(), ex.getMessage(), true, null);
		return new ResponseEntity<>(response, HttpStatus.CONFLICT);
	}

	// Manejo específico para errores de validación
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
		// Obtener el primer mensaje de error
		String errorMessage = ex.getBindingResult().getFieldErrors().stream().findFirst()
				.map(FieldError::getDefaultMessage).orElse("Error de validación.");

		// Crear la respuesta simplificada
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), errorMessage, true, null);
		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}

	// Manejo para errores en validaciones con BindException (por ejemplo, en
	// @ModelAttribute)
	@ExceptionHandler(BindException.class)
	public ResponseEntity<?> handleBindException(BindException ex, WebRequest request) {
		// Obtener el primer mensaje de error
		String errorMessage = ex.getBindingResult().getFieldErrors().stream().findFirst()
				.map(FieldError::getDefaultMessage).orElse("Error de validación.");

		// Crear la respuesta simplificada
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), errorMessage, true, null);
		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}

	// Manejo de cualquier otra excepción no especificada
	@ExceptionHandler(Exception.class)
	public ResponseEntity<?> handleGenericException(Exception ex, WebRequest request) {
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), ex.getMessage(),
				true, null);
		return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	// Captura de NumberFormatException
	@ExceptionHandler(NumberFormatException.class)
	public ResponseEntity<?> handleNumberFormatException(NumberFormatException ex, WebRequest request) {
		// Log (opcional)
		logger.error("NumberFormatException: ", ex);
		// Respuesta amigable para el cliente
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), "Formato numérico incorrecto",
				true, null);
		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}

	// Captura de JsonMappingException
	@ExceptionHandler(JsonMappingException.class)
	public ResponseEntity<?> handleJsonMappingException(JsonMappingException ex, WebRequest request) {
		// Log (opcional)
		logger.error("JsonMappingException: ", ex);
		// Respuesta amigable para el cliente
		ApiResponse<Object> response = new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), "Error al procesar los datos",
				true, null);
		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}
	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<?> handleBusinessException(BusinessException ex, WebRequest request) {
		// Usamos tu ApiResponse estandar
		ApiResponse<Object> response = new ApiResponse<>(ex.getStatus().value(), ex.getMessage(), true, null);
		return new ResponseEntity<>(response, ex.getStatus());
	}

}
