package com.inventory.catalog.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class CommunityModerationService {

    private static final int MIN_CHARS = 3;
    private static final int MAX_CHARS = 2000;

    private final List<Pattern> bannedPatterns = List.of(
            Pattern.compile("\\b(puta|putas|puto|putos|hijueputa|hp|gonorrea|gonorreoso|malparido|malparida)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(mierda|cagar|cagada|cagado|culo|culero|culera|maric[oó]n|marica|maricas)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(verga|pene|vagina|co[ñn]o|joder|coger|follare?|pendejo|pendeja)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(idiota|est[uú]pido|imb[eé]cil|retrasado|retrasada|subnormal)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(hdp|ptm|ctm|ojal[aá]\\s+te\\s+mueras?)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(matar|asesinar|eliminar|amenaza[rs]?)\\s+(a\\s+)?(el|la|los|las)\\s+\\w+", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(click\\s+here|haz\\s+clic|gana\\s+dinero\\s+f[aá]cil|trabaja\\s+desde\\s+casa)\\b", Pattern.CASE_INSENSITIVE)
    );

    public String validatePostContent(String content) {
        String trimmed = normalizeRequired(content, "La publicación debe tener contenido.");
        if (trimmed.length() < MIN_CHARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La publicación debe tener al menos 3 caracteres.");
        }
        if (trimmed.length() > MAX_CHARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Máximo 2000 caracteres permitidos.");
        }
        if (bannedPatterns.stream().anyMatch(pattern -> pattern.matcher(trimmed).find())) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Tu publicación contiene palabras no permitidas. Cuida el lenguaje de nuestra comunidad."
            );
        }
        return trimmed;
    }

    public String normalizeRequired(String value, String message) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return trimmed;
    }

    public String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
