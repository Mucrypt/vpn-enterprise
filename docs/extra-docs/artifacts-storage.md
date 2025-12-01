# Artifacts Storage — S3/IPFS Integration Plan

Goal: Store deployable artifacts (images, bundles, backups) with verifiable integrity and edge replication.

## Hash Verification
- Use SHA-256 for artifact hashing
- Store hash alongside metadata (e.g., in `edge_distributions.artifact_hash`)
- Verify on upload/download; reject mismatch

## S3 (Phase 1)
- Bucket per environment (dev/staging/prod)
- Path convention: `services/<serviceId>/artifacts/<timestamp>/<name>`
- Signed URLs for upload/download
- CDN in front of S3 for global reach

## IPFS (Phase 2)
- Pin artifacts via a pinning service
- Record CID alongside SHA-256; verify content-address match
- Gateway access for web; local IPFS client for backend if needed

## API Sketch
```ts
// Upload artifact and record hash
authMiddleware, async (req, res) => {
  const { serviceId, name } = req.body;
  // 1) Receive file (multipart) or generate bundle
  // 2) Compute SHA-256
  // 3) Upload to S3 -> get URL
  // 4) Save distribution record with hash + URL/CID
}
```

## Security
- Least privilege IAM for S3 access
- Validate file types and size limits
- Log all uploads with user context; consider attestation before storage

## Observability
- Track upload times, replication status, edge cache hit rate
- Alert on verification failures or replication lag