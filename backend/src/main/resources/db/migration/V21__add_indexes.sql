CREATE INDEX IF NOT EXISTS idx_meeting_chat_room_created ON meeting_chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_room_chunk ON meeting_transcripts(room_id, chunk_index);
