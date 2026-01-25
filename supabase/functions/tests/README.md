# Edge Function Integration Tests

Comprehensive integration tests for Supabase Edge Functions.

## Running Tests

### Local Development

```bash
# Start Supabase locally
npx supabase start

# Run all tests
deno test --allow-all supabase/functions/tests/

# Run specific test file
deno test --allow-all supabase/functions/tests/seed-users.test.ts

# Run with coverage
deno test --allow-all --coverage=coverage/ supabase/functions/tests/
deno coverage coverage/
```

### CI/CD

Add to `.github/workflows/test.yml`:

```yaml
name: Test Edge Functions
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - name: Run tests
        run: deno test --allow-all supabase/functions/tests/
```

## Test Coverage

### Security Tests
- ✅ Authentication requirement
- ✅ Admin secret validation
- ✅ Authorization checks
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS headers

### Functional Tests
- ✅ Successful operations
- ✅ Error handling
- ✅ Edge cases
- ✅ Data validation

## Test Structure

Each test file follows this pattern:

```typescript
import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";

const BASE_URL = Deno.env.get("FUNCTION_URL") || "http://localhost:54321/functions/v1";

Deno.test("function-name: authentication required", async () => {
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ /* test data */ })
  });

  assertEquals(response.status, 401);
});

Deno.test("function-name: successful operation", async () => {
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("TEST_JWT")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ /* valid data */ })
  });

  assertEquals(response.status, 200);
});
```

## Environment Variables

Required for tests:

```bash
# .env.test
FUNCTION_URL=http://localhost:54321/functions/v1
TEST_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Valid test JWT
SEED_ADMIN_SECRET=test_admin_secret
```

## Mocking

For tests that require external services (AI APIs), use mocking:

```typescript
import { stub } from "https://deno.land/std/testing/mock.ts";

Deno.test("function with mocked AI call", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ result: "mocked" })))
  );

  try {
    // Your test here
  } finally {
    fetchStub.restore();
  }
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Speed**: Use mocks for external services
4. **Coverage**: Aim for >80% code coverage
5. **Documentation**: Add comments for complex tests

## Troubleshooting

### Tests fail with "Connection refused"

Make sure Supabase is running:
```bash
npx supabase status
npx supabase start
```

### Authentication errors

Generate a valid test JWT:
```bash
npx supabase test db --jwt-secret
```

### Rate limiting in tests

Either:
- Use different identifiers for each test
- Reset rate limiter state between tests
- Mock the rate limiter
