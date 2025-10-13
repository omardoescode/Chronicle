export function apiKeyInvalid(apiKey: string | undefined): string {
  if (!apiKey || apiKey.length === 0) {
    return 'API Key cannot be empty'
  }
  // SHA256 hashes are 64 hex characters
  if (!/^[0-9a-f]{64}$/i.test(apiKey)) {
    return 'API Key must be a valid SHA256 hash'
  }
  return ''
}
