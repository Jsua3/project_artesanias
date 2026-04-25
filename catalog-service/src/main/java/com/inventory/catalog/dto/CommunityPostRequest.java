package com.inventory.catalog.dto;

public record CommunityPostRequest(
        String content,
        String imageUrl,
        String authorName,
        String authorAvatarUrl
) {
}
