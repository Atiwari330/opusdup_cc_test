# Deepgram Nova Medical Model

## Overview

Nova-3 Medical is Deepgram's specialized speech-to-text model designed for healthcare transcription with industry-leading accuracy.

## Key Performance Metrics

- **Word Error Rate**: 3.45% (63.6% improvement over competitors)
- **Keyword Recall Rate**: 93.99% for critical medical terms
- **Processing Speed**: 5-40x faster than competitors
- **Cost**: $0.0077 per minute (50% cheaper than alternatives)

## Model Selection

```javascript
// Use Nova-3 Medical for streaming
const connection = deepgramClient.listen.live({
  model: "nova-3-medical",
  smart_format: true,
  language: "en",
});

// Use Nova-3 Medical for batch processing
const { result } = await deepgramClient.listen.prerecorded.transcribeUrl(
  {
    url: audioUrl,
  },
  {
    model: "nova-3-medical",
    smart_format: true,
  }
);
```

## Medical-Specific Features

- Accurate capture of medical terminology, acronyms, and clinical jargon
- Enhanced performance in noisy hospital environments
- Integration with Electronic Health Records (EHR) systems
- HIPAA-compliant architecture with end-to-end encryption

## Use Cases

- Clinical documentation and note-taking
- Therapeutic scribing during patient encounters
- Medical dictation and transcription services
- Telemedicine appointment transcription
- Real-time medical conversation analysis

## Availability

- **Hosted**: Available now for streaming and batch
- **Self-hosted**: Coming in subsequent releases
- **Language Support**: English only (currently)

## Implementation Example

```javascript
const medicalTranscription = deepgramClient.listen.live({
  model: "nova-3-medical",
  smart_format: true,
  diarize: true,
  punctuate: true,
  interim_results: true,
});
```
