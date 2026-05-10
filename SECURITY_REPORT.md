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

<img width="1306" height="647" alt="Screenshot 2026-05-09 122850" src="https://github.com/user-attachments/assets/e01514e5-b272-40a8-988f-4746acea479b" />

<img width="1586" height="687" alt="Screenshot 2026-05-09 130749" src="https://github.com/user-attachments/assets/2110a3e2-acb7-4e68-a688-56f19f72fac4" />

<img width="1905" height="902" alt="Screenshot 2026-05-09 123849" src="https://github.com/user-attachments/assets/3a64ddeb-acab-4d40-b4f3-b9d21ebe0a08" />



## Recommended Fix

Implement Nginx rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=sendgrid_limit:10m rate=2r/m;

location /api/sendgrid {
    limit_req zone=sendgrid_limit burst=1 nodelay;
    proxy_pass http://localhost:3000;
}
```
<img width="1916" height="1020" alt="Screenshot 2026-05-09 130133" src="https://github.com/user-attachments/assets/e4e2364e-3c47-478a-9a91-0b9e2d44658d" />

<img width="1919" height="869" alt="Screenshot 2026-05-09 130215" src="https://github.com/user-attachments/assets/92f4ca75-dcc1-4bc6-a56a-dcde13680bee" />


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
<img width="1758" height="249" alt="Screenshot 2026-05-09 131353" src="https://github.com/user-attachments/assets/13e269bc-dc58-482e-a443-b94e9ebea3ac" />

---

## Result

The received email rendered:

* Injected HTML content
* Clickable attacker-controlled links
* Manipulated formatting inside the email body

This confirmed that HTML content was executed instead of displayed as plain text.

<img width="1919" height="907" alt="Screenshot 2026-05-09 131639" src="https://github.com/user-attachments/assets/d183dada-3041-4f9d-88fa-6f112d7a5244" />

<img width="1919" height="845" alt="Screenshot 2026-05-09 132524" src="https://github.com/user-attachments/assets/8df154bd-ff02-47be-9367-0ccb4dcc1f89" />


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

<img width="1167" height="504" alt="image" src="https://github.com/user-attachments/assets/dde48aeb-b55d-49f1-904d-2e3c88615b16" />


### Secure Usage

```ts
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Message:</strong> ${escapeHtml(message)}</p>
```
<img width="1450" height="525" alt="image" src="https://github.com/user-attachments/assets/189d7745-c4ad-4d3f-aa79-c872c38694dc" />

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
<img width="1572" height="666" alt="Screenshot 2026-05-09 133200" src="https://github.com/user-attachments/assets/fd61a26f-c971-48ec-b5fc-a1fc368aeaeb" />

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
<img width="1919" height="266" alt="Screenshot 2026-05-09 132831" src="https://github.com/user-attachments/assets/d60c3111-683f-4b09-a154-40bc87329fb6" />

---

## Result

The API accepted invalid data and attempted to process the request instead of rejecting it with validation errors.

<img width="1505" height="767" alt="Screenshot 2026-05-09 133040" src="https://github.com/user-attachments/assets/8bdec633-dfeb-4f4d-bfde-f210162ee4f5" />

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
<img width="1077" height="196" alt="image" src="https://github.com/user-attachments/assets/7092fe4f-a817-4577-ba69-2dc040841c47" />


---

## Verification

After remediation:

* Invalid payloads returned HTTP `400 Bad Request`
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
<img width="1409" height="292" alt="Screenshot 2026-05-09 134142" src="https://github.com/user-attachments/assets/7d35ba57-82af-45b0-a19a-de361f2dbb3b" />

---

## Result

The request was accepted successfully even though it originated from an untrusted domain.

<img width="973" height="503" alt="Screenshot 2026-05-09 134222" src="https://github.com/user-attachments/assets/d8e85a21-702b-4b12-85f7-8f8ff63e61c8" />

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
<img width="1481" height="444" alt="image" src="https://github.com/user-attachments/assets/419aa451-0734-42cf-9a10-33bab8081063" />

---

## Verification

After remediation:

* Requests from untrusted domains returned HTTP `403 Forbidden`
* Only requests originating from the official frontend domain were accepted

<img width="1483" height="219" alt="image" src="https://github.com/user-attachments/assets/c2257788-b28b-41ac-9eae-656926175cdc" />


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
<img width="1919" height="1031" alt="Screenshot 2026-05-09 134927" src="https://github.com/user-attachments/assets/20e1b66e-79fc-44a6-a070-bb2bd894d97c" />



---

## Result

```txt
11 vulnerabilities detected

2 Critical
5 High
4 Moderate
```
<img width="1916" height="1015" alt="Screenshot 2026-05-09 134905" src="https://github.com/user-attachments/assets/12da8af2-5f15-4228-9ab1-de4d229b5661" />

---

## Recommended Fix

Update vulnerable dependencies:

```bash
npm audit fix
npm install next@latest
npm update
```
<img width="1919" height="699" alt="Screenshot 2026-05-09 170839" src="https://github.com/user-attachments/assets/25d77488-c68b-4c0c-adb4-e9ae4040150c" />

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
