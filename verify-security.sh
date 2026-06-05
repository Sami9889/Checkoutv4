#!/bin/bash

# PayLinkBridge v3.0.0 - Security Verification Script
# This script verifies all security fixes are properly implemented

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PayLinkBridge v3.0.0 - Security Verification                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if string exists in file
check_not_in_file() {
  local pattern=$1
  local file=$2
  local description=$3

  if grep -r "$pattern" "$file" > /dev/null 2>&1; then
    echo -e "${RED}✗ FAIL${NC}: $description"
    echo "  Found in: $file"
    ((FAIL++))
    return 1
  else
    echo -e "${GREEN}✓ PASS${NC}: $description"
    ((PASS++))
    return 0
  fi
}

# Function to check if string exists in file
check_in_file() {
  local pattern=$1
  local file=$2
  local description=$3

  if grep -r "$pattern" "$file" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: $description"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}: $description"
    echo "  Should be in: $file"
    ((FAIL++))
    return 1
  fi
}

# Function to check if file exists
check_file_exists() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $description"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}: $description"
    echo "  Missing file: $file"
    ((FAIL++))
    return 1
  fi
}

echo "CHECKING HARDCODED SECRETS REMOVAL..."
echo "═══════════════════════════════════════════════════════════════"

check_not_in_file "SAMRATH SINGH" "server/" "Hardcoded name removed"
check_not_in_file "4760652" "server/" "Hardcoded account number removed"
check_not_in_file "062948" "server/" "Hardcoded BSB removed"
check_not_in_file "ZUCCOTTI" "server/" "Hardcoded address removed"

echo ""
echo "CHECKING GITHUB API REMOVAL..."
echo "═══════════════════════════════════════════════════════════════"

check_not_in_file "node-fetch" "server/" "node-fetch import removed"
check_not_in_file "createGitHubIssue" "server/" "GitHub issue function removed"
check_not_in_file "github.com/api" "server/" "GitHub API calls removed"
check_not_in_file "GITHUB_TOKEN" ".env.example" "GITHUB_TOKEN removed from .env"
check_not_in_file "GITHUB_OWNER" ".env.example" "GITHUB_OWNER removed from .env"
check_not_in_file "GITHUB_REPO" ".env.example" "GITHUB_REPO removed from .env"

echo ""
echo "CHECKING NODEMAILER REMOVAL..."
echo "═══════════════════════════════════════════════════════════════"

check_not_in_file "nodemailer" "server/" "nodemailer import removed"
check_not_in_file "transporter.sendMail" "server/" "nodemailer sendMail calls removed"
check_not_in_file "SMTP_HOST" ".env.example" "SMTP_HOST removed from .env"
check_not_in_file "SMTP_USER" ".env.example" "SMTP_USER removed from .env"
check_not_in_file "SMTP_PASS" ".env.example" "SMTP_PASS removed from .env"

echo ""
echo "CHECKING NEW SECURITY FEATURES..."
echo "═══════════════════════════════════════════════════════════════"

check_in_file "queueEmail" "server/email-service.js" "Internal email queue implemented"
check_in_file "getEmailHistory" "server/email-service.js" "Email history function implemented"
check_in_file "createInternalIssue" "server/customers.js" "Internal issue tracking implemented"
check_in_file "createAuditLog" "server/customers.js" "Audit logging implemented"
check_in_file "hashPassword" "server/crypto-utils.js" "Password hashing implemented"
check_in_file "verifyPassword" "server/crypto-utils.js" "Password verification implemented"
check_in_file "sessionToken" "server/server.js" "Session management implemented"
check_in_file "MAX_LOGIN_ATTEMPTS" "server/server.js" "Rate limiting implemented"

echo ""
echo "CHECKING ENVIRONMENT CONFIGURATION..."
echo "═══════════════════════════════════════════════════════════════"

check_in_file "MASTER_SECRET_KEY" ".env.example" "MASTER_SECRET_KEY in .env"
check_in_file "BANK_ACCOUNT_NAME" ".env.example" "BANK_ACCOUNT_NAME in .env"
check_in_file "BANK_ACCOUNT_NUMBER" ".env.example" "BANK_ACCOUNT_NUMBER in .env"
check_in_file "ADMIN_PASS" ".env.example" "ADMIN_PASS in .env"

echo ""
echo "CHECKING GITIGNORE..."
echo "═══════════════════════════════════════════════════════════════"

check_in_file "server/customers.json" ".gitignore" "customers.json in gitignore"
check_in_file "server/emails.json" ".gitignore" "emails.json in gitignore"
check_in_file "server/audit-log.json" ".gitignore" "audit-log.json in gitignore"
check_in_file "server/sessions.json" ".gitignore" "sessions.json in gitignore"
check_in_file "server/admin-attempts.json" ".gitignore" "admin-attempts.json in gitignore"

echo ""
echo "CHECKING FILES EXIST..."
echo "═══════════════════════════════════════════════════════════════"

check_file_exists "server/email-service.js" "Email service file exists"
check_file_exists "server/customers.js" "Customers file exists"
check_file_exists "server/server.js" "Server file exists"
check_file_exists "server/crypto-utils.js" "Crypto utils file exists"
check_file_exists "SECURITY_HARDENING.md" "Security hardening doc exists"
check_file_exists "DEPLOYMENT_GUIDE.md" "Deployment guide exists"
check_file_exists "SECURITY_FIXES_SUMMARY.md" "Security fixes summary exists"

echo ""
echo "CHECKING DEPENDENCIES..."
echo "═══════════════════════════════════════════════════════════════"

# Check package.json for removed dependencies
if grep -q "\"nodemailer\"" "package.json"; then
  echo -e "${RED}✗ FAIL${NC}: nodemailer should be removed from package.json"
  ((FAIL++))
else
  echo -e "${GREEN}✓ PASS${NC}: nodemailer removed from package.json"
  ((PASS++))
fi

if grep -q "\"node-fetch\"" "package.json"; then
  echo -e "${RED}✗ FAIL${NC}: node-fetch should be removed from package.json"
  ((FAIL++))
else
  echo -e "${GREEN}✓ PASS${NC}: node-fetch removed from package.json"
  ((PASS++))
fi

# Check for required dependencies
if grep -q "\"bcrypt\"" "package.json"; then
  echo -e "${GREEN}✓ PASS${NC}: bcrypt is in package.json"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}: bcrypt should be in package.json"
  ((FAIL++))
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VERIFICATION SUMMARY                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}✓ PASSED: $PASS${NC}"
echo -e "  ${RED}✗ FAILED: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ ALL SECURITY CHECKS PASSED - SYSTEM IS HARDENED${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}✗ SOME CHECKS FAILED - REVIEW ABOVE${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  exit 1
fi
