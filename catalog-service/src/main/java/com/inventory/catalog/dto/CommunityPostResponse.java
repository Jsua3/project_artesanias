package com.inventory.catalog.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommunityPostResponse(
        UUID id,
        UUID authorId,
        String authorName,
        String authorAvatarUrl,
        String content,
        String imageUrl,
        LocalDateTime createdAt,
        Integer likesCount,
        Integer commentsCount,
        String estado,
        Boolean likedByMe
) {
}
