# Bugs

Pattern: [severity(x)] [category] bug description.

## Todos

Pattern: [Category] [priority] Todo
  
### High Priority

- [ ] Backend: storage management
  - [x] Check remaining storage space.
  - Develop a strategy for removing old data.
  - Consider using S3 storage for audio files.

- [ ] Design: custom audio player

- [ ] Server: rate limit
  - Character limit: daily limit of 10,000 characters. Show remaining characters.
  - Request limit: 20 requests per minute. Implement a system to track and enforce this limit.

- [ ] Add Api Documentaions

### Medium Priority

- [ ] Frontend: add translation support for reader page

- [ ] Model maintenance
  - Pin Supertonic supplementary Hugging Face assets to a verified revision and validate checksums.
  - Add digest-aware model version tracking and an explicit revision marker per downloaded model.
  - Filter unsupported model families such as Matcha and Kokoro out of the live sherpa-onnx catalog.
  - Expose Supertonic's `na` fallback language alias.
  - Evaluate `sherpa-onnx-node` 1.13.4 and `onnxruntime-node` 1.27.0 separately.
  - Compare the July 2026 Swedish Piper re-uploads with the currently cached models before replacing them.
  - Consider custom Supertonic voice-style JSON uploads for Voice Builder exports.

### Low Priority

- [ ] Design: add dark theme switch
- [ ] Design: update generate UI
- [ ] Frontend: edit text in Reader page
