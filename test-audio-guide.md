# Audio Testing Guide for Chrome Extension

## Important: Audio Source Requirements

For the transcription to work, you need **actual speech audio** playing in the tab. Here are the best test scenarios:

### 1. YouTube Video with Speech (Recommended)
- Open a YouTube video with clear speech (news, tutorials, podcasts)
- Examples:
  - TED Talks: https://www.youtube.com/c/TED
  - News channels
  - Educational content
- Make sure the video is **playing** and **not muted**
- Volume should be at a normal level

### 2. Test Steps
1. Open a YouTube video with speech
2. Start playing the video
3. Open the extension side panel
4. Click "Start Recording"
5. Let it record for 10-15 seconds
6. You should see transcriptions appear in the panel

### 3. Debugging Empty Transcripts
If you're getting empty transcripts:
- Check that the tab has audio playing
- Ensure the tab is not muted
- Try a different video with clearer speech
- Check browser console for any errors

### 4. What to Look For
- Server logs should show "First 10 bytes: XX XX XX..." with non-zero values
- You should see transcript text appearing in the side panel
- Final transcripts will be marked as such

## Common Issues

1. **Silent Audio**: If recording from a tab with no audio or very quiet audio
2. **Muted Tab**: Chrome might mute the tab when capturing
3. **Background Music**: Videos with only music won't produce transcripts
4. **Language**: Currently configured for English (en-US)