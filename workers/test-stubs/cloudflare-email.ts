// Stand-in for the `cloudflare:email` runtime module, which only exists inside
// workerd. vitest.config.ts aliases the import here for Worker tests.
export class EmailMessage {
  constructor(
    public from: string,
    public to: string,
    public raw: string,
  ) {}
}
