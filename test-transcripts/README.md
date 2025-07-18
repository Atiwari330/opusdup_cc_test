# Test Transcripts Directory

Place your test PDF transcripts in this directory to test the EHR pipeline.

## Usage

```bash
# Test a PDF transcript
pnpm test:ehr ./test-transcripts/your-transcript.pdf
```

## Sample Transcript Format

The PDF should contain a therapy session transcript with dialogue between provider and patient. For example:

```
Provider: Good morning, how have you been feeling since our last session?
Patient: I've been having a really tough week. The anxiety has been worse...
[etc.]
```

The pipeline will extract SOAP notes from the transcript automatically.