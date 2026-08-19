package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.TranscriptChunkResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class TranscriptController {

    private final TranscriptService transcriptService;

    @PostMapping("/{id}/transcript")
    public ApiResponse<TranscriptChunkResponse> uploadChunk(
            @PathVariable Long id,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("chunkIndex") int chunkIndex,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(transcriptService.uploadChunk(id, principal.getId(), audio, chunkIndex));
    }
}
