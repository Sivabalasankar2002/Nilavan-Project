# SECURITY REPORT

## Application

Nilavan Portfolio Website

## Target

[https://nilvan.duckdns.org](https://nilvan.duckdns.org)

## Assessment Type

Web Application Security Assessment

## Assessment Date

9 May 2026

---

# Executive Summary

A security assessment was conducted against the contact form API endpoint exposed by the application.

Multiple vulnerabilities were identified affecting the security posture of the application, including:

* Missing rate limiting
* HTML Injection
* Missing server-side validation
* Broken access control
* Vulnerable and outdated dependencies

Several vulnerabilities could allow attackers to abuse the email functionality, inject malicious content into business emails, automate spam submissions, and potentially exploit vulnerable third-party packages.


---

# Scope

The following endpoint was assessed:

```txt
/api/sendgrid
```

---

# Findings Summary

| ID | Vulnerability                                      | Severity        | OWASP Category                                |
| -- | -------------------------------------------------- | --------------- | --------------------------------------------- |
| 1  | Missing Rate Limiting on Contact Form API          | High            | A04:2021 – Insecure Design                    |
| 2  | HTML Injection in Contact Form Email Template      | High            | A03:2021 – Injection                          |
| 3  | Missing Server-Side Input Validation               | High            | A05:2021 – Security Misconfiguration          |
| 4  | No Origin / Referer Validation on Contact Form API | Medium          | A01:2021 – Broken Access Control              |
| 5  | Vulnerable and Outdated Dependencies               | Critical / High | A06:2021 – Vulnerable and Outdated Components |

---

# 1. Missing Rate Limiting on Contact Form API

## OWASP Category

A04:2021 – Insecure Design

## Severity

High

## Affected Files

### Nginx Configuration

```txt
/etc/nginx/sites-available/lt-nilavan
```

### Application Endpoint

```txt
/api/sendgrid
```

---

## Description

The `/api/sendgrid` endpoint accepted unlimited POST requests without any rate limiting or abuse prevention mechanism.

The vulnerability existed because no request throttling controls were implemented at either the reverse proxy layer or the application layer.

---

## Business Impact

An attacker can:

* Flood the business inbox with spam emails
* Exhaust the SendGrid email quota
* Cause operational disruption
* Increase infrastructure costs
* Abuse server resources

---

## Proof of Concept

```bash
for i in $(seq 1 20); do
curl -X POST https://nilvan.duckdns.org/api/sendgrid \
-H "Content-Type: application/json" \
-d '{
"name":"spam",
"email":"test@test.com",
"phone":"9999999999",
"message":"spam"
}'
done
```

---

## Result

All requests were accepted successfully without any restriction.

---

## Recommended Fix

Implement Nginx rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=sendgrid_limit:10m rate=2r/m;

location /api/sendgrid {
    limit_req zone=sendgrid_limit burst=1 nodelay;
    proxy_pass http://localhost:3000;
}
```

---

---

# 2. HTML Injection in Contact Form Email Template

## OWASP Category

A03:2021 – Injection

## Severity

High

## Affected File

```txt
app/api/sendgrid/route.ts
```

## Affected Lines

```txt
Lines 28-44
```

---

## Vulnerable Code

```ts
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone}</p>
<p><strong>Message:</strong> ${message}</p>
```

---

## Description

The application directly inserted user-controlled input into the HTML email template without sanitization or escaping.

Because the values were rendered inside the HTML body, attackers could inject arbitrary HTML content including:

* Phishing links
* Fake buttons
* Misleading formatting
* Social engineering content

---

## Business Impact

An attacker can:

* Inject malicious HTML into business emails
* Add phishing or scam links
* Manipulate email content viewed by staff
* Spoof trusted-looking messages
* Mislead employees into clicking attacker-controlled URLs

---

## Proof of Concept

```bash
curl -X POST https://nilvan.duckdns.org/api/sendgrid \
-H "Content-Type: application/json" \
-d '{
"name":"Attacker",
"email":"test@test.com",
"phone":"9999999999",
"message":"<h2>Important Documents</h2><a href=\"https://example.com\">Click Here To View</a>"
}'
```

---

## Result

The received email rendered:

* Injected HTML content
* Clickable attacker-controlled links
* Manipulated formatting inside the email body

This confirmed that HTML content was executed instead of displayed as plain text.

---

## Recommended Fix

Escape all user-controlled values before inserting them into HTML.

### Secure Remediation Example

```ts
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
```

### Secure Usage

```ts
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Message:</strong> ${escapeHtml(message)}</p>
```

---

## Verification

After remediation:

* HTML tags were displayed as plain text
* No injected links were rendered
* Malicious content was neutralized successfully

---

# 3. Missing Server-Side Input Validation

## OWASP Category

A05:2021 – Security Misconfiguration

## Severity

High

## Affected File

```txt
app/api/sendgrid/route.ts
```

## Affected Lines

```txt
Lines 6-7
```

---

## Vulnerable Code

```ts
const body = await req.json();
const { name, email, phone, message } = body;
```

---

## Description

The `/api/sendgrid` endpoint did not validate user input on the server side.

Validation existed only on the frontend and could easily be bypassed through direct API requests.

The API accepted:

* Invalid email addresses
* Oversized payloads
* Non-string values
* Empty fields
* Malicious content

---

## Business Impact

An attacker can:

* Send malformed requests directly to the API
* Cause email delivery failures
* Generate unnecessary server load
* Flood logs with invalid requests
* Abuse the endpoint using oversized payloads

---

## Proof of Concept

```bash
curl -X POST https://nilvan.duckdns.org/api/sendgrid \
-H "Content-Type: application/json" \
-d '{
"name":12345,
"email":"not-an-email",
"phone":"AAAAAAA",
"message":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
}'
```

---

## Result

The API accepted invalid data and attempted to process the request instead of rejecting it with validation errors.

---

## Recommended Fix

Implement strict server-side validation using Zod.

### Example Remediation

```ts
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  phone: z.string().min(7).max(20),
  message: z.string().min(1).max(1000),
});

const parsed = ContactSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  );
}
```

---

## Verification

After remediation:

* Invalid payloads returned HTTP `400 Bad Request`
* Oversized requests were rejected
* Only properly formatted input was accepted

---

# 4. No Origin / Referer Validation on Contact Form API

## OWASP Category

A01:2021 – Broken Access Control

## Severity

Medium

## Affected File

```txt
app/api/sendgrid/route.ts
```

## Affected Line

```txt
Line 5
```

---

## Description

The `/api/sendgrid` endpoint accepted requests from any origin without validating trusted frontend domains.

The backend failed to verify:

* `Origin` header
* `Referer` header
* Trusted frontend sources

Attackers could therefore interact directly with the API using:

* curl
* Postman
* Automated scripts
* External malicious websites

---

## Business Impact

An attacker can:

* Abuse the public API externally
* Automate spam submissions
* Bypass frontend restrictions
* Trigger unauthorized backend requests

---

## Proof of Concept

```bash
curl -X POST https://nilvan.duckdns.org/api/sendgrid \
-H "Origin: https://evil.com" \
-H "Referer: https://evil.com" \
-H "Content-Type: application/json" \
-d '{
"name":"attacker",
"email":"evil@test.com",
"phone":"9999999999",
"message":"unauthorized request"
}'
```

---

## Result

The request was accepted successfully even though it originated from an untrusted domain.

---

## Recommended Fix

Implement trusted origin validation inside:

```txt
app/api/sendgrid/route.ts
```

### Remediation Example

```ts
const origin = req.headers.get("origin");
const referer = req.headers.get("referer");

const allowedOrigin = "https://nilvan.duckdns.org";

if (
  origin !== allowedOrigin ||
  !referer?.startsWith(allowedOrigin)
) {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}
```

---

## Verification

After remediation:

* Requests from untrusted domains returned HTTP `403 Forbidden`
* Only requests originating from the official frontend domain were accepted

---

# 5. Vulnerable and Outdated Dependencies

## OWASP Category

A06:2021 – Vulnerable and Outdated Components

## Severity

Critical / High

---

## Description

The application contained multiple outdated third-party dependencies identified through `npm audit`.

Several installed packages had publicly disclosed security vulnerabilities affecting the application's security posture.

---

## Affected Components

* next
* axios
* lodash
* form-data
* glob
* postcss

---

## Business Impact

Exploitation of vulnerable dependencies may lead to:

* Remote code execution
* Prototype pollution
* Server-side request forgery (SSRF)
* Denial of service
* Dependency chain compromise
* Application instability

---

## Proof of Concept

```bash
npm audit
```

---

## Result

```txt
11 vulnerabilities detected

2 Critical
5 High
4 Moderate
```

---

## Recommended Fix

Update vulnerable dependencies:

```bash
npm audit fix
npm install next@latest
npm update
```

---

## Verification

```bash
npm audit
```

### Expected Result

```txt
found 0 vulnerabilities
```

---

# Overall Risk Rating

| Severity | Count |
| -------- | ----- |
| Critical | 1     |
| High     | 3     |
| Medium   | 1     |

---


---

# Conclusion

The application exposed multiple high-risk vulnerabilities that could allow attackers to abuse the contact form functionality, inject malicious content, and exploit vulnerable dependencies.
