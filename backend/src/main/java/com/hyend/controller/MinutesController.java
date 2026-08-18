package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.dto.meeting.MinutesUpdateRequest;
import com.hyend.dto.meeting.TranscriptResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MinutesService;
import com.hyend.service.TranscriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/meetings/{roomId}")
@RequiredArgsConstructor
public class MinutesController {

    private final TranscriptService transcriptService;
    private final MinutesService minutesService;

    @PostMapping("/transcripts")
    public CompletableFuture<ApiResponse<TranscriptResponse>> uploadTranscript(
            @PathVariable Long roomId,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("chunkIndex") int chunkIndex,
            @AuthenticationPrincipal UserPrincipal principal) {
        return transcriptService
                .transcribeAsync(roomId, principal.getId(), audio, chunkIndex)
                .thenApply(ApiResponse::ok);
    }

    @GetMapping("/transcripts")
    public ApiResponse<List<TranscriptResponse>> getTranscripts(@PathVariable Long roomId) {
        return ApiResponse.ok(transcriptService.getTranscripts(roomId));
    }

    @PostMapping("/minutes/generate")
    public ApiResponse<MinutesResponse> generateMinutes(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(minutesService.generate(roomId, principal.getId()));
    }

    @GetMapping("/minutes")
    public ApiResponse<MinutesResponse> getMinutes(@PathVariable Long roomId) {
        return ApiResponse.ok(minutesService.getMinutes(roomId));
    }

    @PutMapping("/minutes")
    public ApiResponse<MinutesResponse> updateMinutes(
            @PathVariable Long roomId,
            @Valid @RequestBody MinutesUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(minutesService.updateMinutes(roomId, principal.getId(), request.content()));
    }
}
