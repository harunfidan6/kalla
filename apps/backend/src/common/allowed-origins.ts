export function getAllowedOrigins(): string[] {
  return process.env.NODE_ENV === 'production'
    ? ['https://kalla.co', 'https://admin.kalla.co']
    : [
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:3000',
        'http://localhost:4000',
        'http://localhost:19006',
        'http://localhost:19000',
      ];
}
