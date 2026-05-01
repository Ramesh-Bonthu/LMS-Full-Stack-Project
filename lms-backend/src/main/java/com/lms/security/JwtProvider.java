package com.lms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;

@Component
public class JwtProvider {

	@Value("${jwt.secret}")
	private String jwtSecret;

	@Value("${jwt.expiration}")
	private int jwtExpirationMs;

	private SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecret.getBytes());
	}

	public String generateToken(Integer userId, String email, String role) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("userId", userId);
		claims.put("role", role);
		claims.put("email", email);

		return createToken(claims, email);
	}

	private String createToken(Map<String, Object> claims, String subject) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

		return Jwts.builder().claims(claims).subject(subject).issuedAt(now).expiration(expiryDate)
				.signWith(getSigningKey()).compact();
	}

	public Claims getClaimsFromToken(String token) {
		return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
	}

	public String getUsernameFromToken(String token) {
		return getClaimsFromToken(token).getSubject();
	}

	public Integer getUserIdFromToken(String token) {
		return (Integer) getClaimsFromToken(token).get("userId");
	}

	public String getRoleFromToken(String token) {
		return (String) getClaimsFromToken(token).get("role");
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public boolean isTokenExpired(String token) {
		try {
			Claims claims = getClaimsFromToken(token);
			return claims.getExpiration().before(new Date());
		} catch (Exception e) {
			return true;
		}
	}
}
