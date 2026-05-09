# DEPLOYMENT.md

# Secure Deployment Documentation – Nilavan Application

## Project Overview

This document explains the complete deployment process of a secure production-ready Next.js application on Ubuntu 24.04 using:

* Ubuntu 24.04 VPS
* Nginx Reverse Proxy
* PM2 Process Manager
* DuckDNS
* SSL using Certbot
* SSH Hardening
* GitHub SSH Deployment
* Elastic IP Configuration

---

# 1. Infrastructure Setup

## 1.1 Created VPC Network

A custom VPC was created with:

* Public subnet
* Internet Gateway (IGW)
* Route table configuration
* Public internet access

<img width="1919" height="891" alt="image" src="https://github.com/user-attachments/assets/440815ca-77a3-42a0-b397-d88f42f2f863" />



* VPC Dashboard
* Subnet Configuration
* Route Table
* Internet Gateway Attached

---
<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/68278f07-fae5-4d83-a063-e76194655e73" />

# 2. Virtual Machine Creation

## 2.1 Created Ubuntu VM

VM Details:

| Configuration | Value            |
| ------------- | ---------------- |
| OS            | Ubuntu 24.04 LTS |
| Instance Type | e2-medium        |
| Public IP     | Attached         |
| SSH Access    | Enabled          |

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/b8655b32-0b04-4b92-9fb3-14c4915242f7" />


* VM instance dashboard
* Running status
* External IP
* Machine type

<img width="1914" height="896" alt="image" src="https://github.com/user-attachments/assets/88a544de-4ef9-4b7e-bcfb-dfca5d57f5c3" />


---

# 3. Elastic IP Configuration

## 3.1 Created and Attached Elastic IP

An Elastic IP was created from the AWS Management Console and attached to the EC2 instance to provide a static public IP address.

### Steps Performed in AWS Portal

1. Logged in to the AWS Management Console.
2. Navigated to:

   ```text
   EC2 Dashboard → Network & Security → Elastic IPs
   ```
3. Clicked on:

   ```text
   Allocate Elastic IP address
   ```
4. Clicked:

   ```text
   Allocate
   ```
5. Selected the newly created Elastic IP.
6. Clicked:

   ```text
   Actions → Associate Elastic IP address
   ```
7. Chose:

   * Resource type: Instance
   * Selected the Ubuntu EC2 instance
   * Selected the private IP
8. Clicked:

   ```text
   Associate
   ```

The Elastic IP was later mapped to the DuckDNS domain.

<img width="1919" height="924" alt="image" src="https://github.com/user-attachments/assets/cb02d447-d5d1-4a51-9314-86c8be385c64" />


* Elastic IP allocation page
* Elastic IP attached to EC2 instance
* AWS EC2 dashboard showing Elastic IP association
* Public IP mapping in DuckDNS



# 4. User Creation & Hardening

## 4.1 Created Non-Root User

A dedicated deployment user was created.

### Commands Used

```bash
sudo adduser siva-leadtap
sudo usermod -aG sudo siva-leadtap
```

<img width="1908" height="808" alt="Screenshot 2026-05-09 190010" src="https://github.com/user-attachments/assets/c2ec8fc1-69f9-48b2-8d12-fbee0b7bb56a" />

<img width="777" height="104" alt="Screenshot 2026-05-09 190055" src="https://github.com/user-attachments/assets/f65d13a1-2c7f-4a98-af77-57005a478312" />


---

# 5. SSH Security Hardening

## 5.1 SSH Configuration

SSH was hardened using the following settings:

| Setting                   | Value    |
| ------------------------- | -------- |
| SSH Port                  | 2222     |
| Root Login                | Disabled |
| Password Authentication   | Disabled |
| Public Key Authentication | Enabled  |

### SSH Config File

```bash
sudo nano /etc/ssh/sshd_config
```

### Configuration Added

```conf
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### Restart SSH

```bash
sudo systemctl restart ssh
```

### Screenshot Required

* sshd_config file
* SSH restart output
* Successful SSH login using key

  
<img width="1919" height="1018" alt="Screenshot 2026-05-09 190217" src="https://github.com/user-attachments/assets/b4399d09-9965-4a6a-b296-8677173ab8bb" />

<img width="1919" height="1012" alt="Screenshot 2026-05-09 190248" src="https://github.com/user-attachments/assets/af3ec696-c8e7-49fb-845c-54c9c3d5311a" />

sudo systemctl status ssh

ss -tulpn | grep 2222

<img width="1673" height="172" alt="image" src="https://github.com/user-attachments/assets/233f9dbe-b985-45a3-aefb-0d1434e45dbc" />


sudo cat /etc/ssh/sshd_config
```

---

# 6. SSH Key Authentication

## 6.1 Added Public Key Authentication

The SSH public key was added to the new deployment user.

### Commands Used

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```
<img width="1913" height="147" alt="image" src="https://github.com/user-attachments/assets/ce7dc0ef-d764-44eb-8d05-5e560a54687b" />


<img width="1685" height="60" alt="image" src="https://github.com/user-attachments/assets/4efde589-a2a5-4e10-bb82-e2dd516bf152" />


# 7. Installed Required Software

## 7.1 Installed Git

```bash
sudo apt update
sudo apt install git -y
```

## 7.2 Installed Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

## 7.3 Installed PM2

```bash
sudo npm install -g pm2
```

<img width="1011" height="340" alt="image" src="https://github.com/user-attachments/assets/66f2ca6c-1f60-4231-883d-0a79ddab659f" />




# 8. GitHub SSH Deployment

## 8.1 Cloned Repository using SSH

### Commands Used

```bash
git clone git@github.com:Leadtap/lt-nilavan.git
```

<img width="1491" height="145" alt="image" src="https://github.com/user-attachments/assets/3b5db3dc-3090-420a-9a8e-a7396a554ae0" />

<img width="1458" height="150" alt="image" src="https://github.com/user-attachments/assets/348bc247-4323-40e4-9bdf-20cb7c19018d" />


# SendGrid Email Service Configuration
Created SendGrid Account and API Key

A SendGrid account was created for handling email functionality from the Next.js application.

The following steps were completed:

Created SendGrid account
<img width="1915" height="885" alt="image" src="https://github.com/user-attachments/assets/5fcfc4f1-bcb4-4744-a61a-a8b09a8632cd" />

Verified sender email address
<img width="892" height="910" alt="image" src="https://github.com/user-attachments/assets/6d04701d-6b30-4b24-b718-3ce2956468e4" />

<img width="1698" height="318" alt="image" src="https://github.com/user-attachments/assets/9bfce5dd-969d-42f7-8c75-5a7bd50474ef" />


Generated SendGrid API Key

<img width="1913" height="899" alt="image" src="https://github.com/user-attachments/assets/05595c40-89d6-4c1f-b595-370f57b9df04" />

Added environment variables in .env.local
<img width="1447" height="628" alt="image" src="https://github.com/user-attachments/assets/de14533e-4ca6-433c-b398-15e2073a5e65" />



# 9. Application Build & PM2 Setup

## 9.1 Installed Dependencies

```bash
npm install
```
<img width="1869" height="472" alt="image" src="https://github.com/user-attachments/assets/96439a1d-cdb9-483b-9cae-70b2e8e6c412" />


## 9.2 Built Next.js Application

```bash
npm run build
```
<img width="1351" height="655" alt="image" src="https://github.com/user-attachments/assets/4876ffdd-4b5e-433e-b935-972f26439b3b" />


## 9.3 Started Application with PM2

```bash
pm2 start npm --name "next-app" -- start
```

<img width="1790" height="199" alt="image" src="https://github.com/user-attachments/assets/4ed97d3b-0466-4b35-9b07-72815c6db895" />


## 9.4 Saved PM2 Processes

```bash
pm2 save
```
<img width="1297" height="75" alt="image" src="https://github.com/user-attachments/assets/c947b1de-6ccc-4e26-97f4-3006ce1401cf" />


## 9.5 Enabled PM2 Auto Startup

```bash
pm2 startup
```
<img width="1432" height="87" alt="image" src="https://github.com/user-attachments/assets/faeac4f9-e609-4c5b-a52d-b451c38de4c6" />

<img width="1919" height="589" alt="image" src="https://github.com/user-attachments/assets/2808de22-cd95-415c-b73a-29d917e3405a" />


# 10. Nginx Reverse Proxy Configuration

## 10.1 Installed Nginx

```bash
sudo apt install nginx -y
```

<img width="1605" height="428" alt="image" src="https://github.com/user-attachments/assets/e85b8634-e141-4edc-8df3-ddfbe7f4d841" />

<img width="819" height="75" alt="image" src="https://github.com/user-attachments/assets/176899cf-b80e-44af-bceb-da1f72e240a8" />


## 10.2 Created Reverse Proxy Configuration

### Configuration File

```bash
sudo nano /etc/nginx/sites-available/lt-nilavan
```

### Nginx Configuration

server {
    listen 80;
    listen [::]:80;

    server_name _;

    return 301 https://$host$request_uri;
}


### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/lt-nilavan /etc/nginx/sites-enabled/
```

### Test Nginx

```bash
sudo nginx -t
```
<img width="1176" height="111" alt="image" src="https://github.com/user-attachments/assets/75a0f37d-049e-4bb2-9c60-3c0297b92d67" />


### Restart Nginx

```bash
sudo systemctl restart nginx
```


# 11. DuckDNS Configuration

## 11.1 Configured Domain

DuckDNS domain was mapped to the Elastic IP attached to the VPS.

### Domain

```text
https://nilvan.duckdns.org
```

<img width="1919" height="894" alt="image" src="https://github.com/user-attachments/assets/1c2cb668-6aea-44f3-ae95-e600c3d2fc5b" />


```bash
nslookup nilvan.duckdns.org

```
<img width="1076" height="210" alt="image" src="https://github.com/user-attachments/assets/637dcda3-01c5-430b-b8eb-73f65fcd0b83" />

---

# 12. SSL Configuration using Certbot

## 12.1 Installed Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 12.2 Generated SSL Certificate

```bash
sudo certbot --nginx -d nilvan.duckdns.org
```
<img width="1915" height="530" alt="image" src="https://github.com/user-attachments/assets/a5bb1ae5-25b5-42e7-8a7b-c929e79f1650" />


<img width="1291" height="352" alt="image" src="https://github.com/user-attachments/assets/2c223a4c-ad9e-4a47-a2ab-68fada4c28c2" />


# 13. HTTPS Nginx Configuration

## 13.1 Added SSL Configuration

### HTTPS Nginx Configuration

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    http2 on;

    server_name nilvan.duckdns.org;

    # SSL
    ssl_certificate /etc/letsencrypt/live/nilvan.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nilvan.duckdns.org/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:;" always;

    # Block hidden files
    location ~ /\.(?!well-known).* {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block .git access
    location /.git {
        deny all;
        return 403;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api_limit burst=1 nodelay;

        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # Mitigate Next.js middleware vulnerability
        proxy_set_header x-middleware-subrequest "";

        proxy_cache_bypass $http_upgrade;
    }

    # Main app
    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header x-middleware-subrequest "";

        proxy_cache_bypass $http_upgrade;
    }
}

```

### Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

<img width="1919" height="974" alt="image" src="https://github.com/user-attachments/assets/ef501f0e-16ac-4370-a5f3-2180fa3fd6ab" />

---

# 14. Security Improvements

## Implemented Security Controls

| Security Feature                 | Status  |
| -------------------------------- | ------- |
| Non-root deployment user         | Enabled |
| SSH Port Changed                 | Enabled |
| Root Login Disabled              | Enabled |
| Password Authentication Disabled | Enabled |
| Public Key Authentication        | Enabled |
| HTTPS Enabled                    | Enabled |
| Reverse Proxy Configured         | Enabled |
| PM2 Auto Start                   | Enabled |
| .git Public Access Blocked       | Enabled |
| Elastic IP Configured            | Enabled |

---

# 15. Final Deployment Verification

## Production URL

```text
https://nilvan.duckdns.org
```


---

## Website Verification

### Check Local App

```bash
curl -I http://localhost:3000
```

### Check HTTPS Response

```bash
curl -I https://nilvan.duckdns.org
```

### Verify .git Access Blocked

```bash
curl -I https://nilvan.duckdns.org/.git
```

Expected Output:

```text
403 Forbidden
```
<img width="1918" height="530" alt="image" src="https://github.com/user-attachments/assets/569d9b2e-f6af-443f-9fe1-8654d1f73ed4" />

---

# 16. Final Verification Checklist

| Check                          | Status |
| ------------------------------ | ------ |
| Website Accessible             | ✅      |
| HTTPS Working                  | ✅      |
| PM2 Running                    | ✅      |
| Nginx Running                  | ✅      |
| SSH Hardened                   | ✅      |
| SSH Key Authentication Enabled | ✅      |
| .git Access Blocked            | ✅      |
| Elastic IP Attached            | ✅      |

---

# 17. Conclusion

The Next.js application was successfully deployed on Ubuntu 24.04 with:

* Secure SSH hardening
* Non-root deployment user
* Elastic IP configuration
* GitHub SSH deployment
* PM2 process management
* Nginx reverse proxy
* SSL/TLS using Let's Encrypt
* DuckDNS domain configuration
* Production-ready hardened environment

The deployment follows modern security best practices suitable for production environments.
