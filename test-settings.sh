#!/bin/bash

# Test script for Admin Settings functionality
# This script tests the Settings API endpoints

API_URL="${API_URL:-https://foneworldecom.onrender.com/api}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "=========================================="
echo "Admin Settings API Test"
echo "=========================================="
echo "API URL: $API_URL"
echo "Admin Username: $ADMIN_USERNAME"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TOKEN=""

# Test 1: Login
echo -e "${YELLOW}Test 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "  Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "  Response: $LOGIN_RESPONSE"
  exit 1
fi

# Test 2: Get current user info
echo ""
echo -e "${YELLOW}Test 2: Get Current Admin User Info${NC}"
USER_INFO=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$USER_INFO" | grep -q "username"; then
  USERNAME=$(echo "$USER_INFO" | grep -o '"username":"[^"]*' | grep -o '[^"]*$')
  USER_ID=$(echo "$USER_INFO" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
  echo -e "${GREEN}✓ Get current user successful${NC}"
  echo "  User ID: $USER_ID"
  echo "  Username: $USERNAME"
else
  echo -e "${RED}✗ Get current user failed${NC}"
  echo "  Response: $USER_INFO"
  exit 1
fi

# Test 3: Verify token
echo ""
echo -e "${YELLOW}Test 3: Verify Token${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/auth/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$VERIFY_RESPONSE" | grep -q '"valid":true'; then
  echo -e "${GREEN}✓ Token verification successful${NC}"
else
  echo -e "${RED}✗ Token verification failed${NC}"
  echo "  Response: $VERIFY_RESPONSE"
  exit 1
fi

# Test 4: Update username (temporary)
echo ""
echo -e "${YELLOW}Test 4: Update Username${NC}"
TEST_USERNAME="admin_test_$(date +%s)"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/auth/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newUsername\":\"$TEST_USERNAME\",\"newPassword\":null}")

if echo "$UPDATE_RESPONSE" | grep -q '"username":"'$TEST_USERNAME'"'; then
  echo -e "${GREEN}✓ Update username successful${NC}"
  echo "  New Username: $TEST_USERNAME"
  
  # Get new token if provided
  if echo "$UPDATE_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$UPDATE_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo "  New token received"
  fi
  
  # Revert username
  echo "  Reverting username..."
  REVERT_RESPONSE=$(curl -s -X PUT "$API_URL/auth/update" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newUsername\":\"$ADMIN_USERNAME\",\"newPassword\":null}")
  
  if echo "$REVERT_RESPONSE" | grep -q '"username":"'$ADMIN_USERNAME'"'; then
    if echo "$REVERT_RESPONSE" | grep -q "token"; then
      TOKEN=$(echo "$REVERT_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    fi
    echo -e "${GREEN}✓ Username reverted successfully${NC}"
  else
    echo -e "${RED}✗ Failed to revert username${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Update username failed${NC}"
  echo "  Response: $UPDATE_RESPONSE"
  exit 1
fi

# Test 5: Update password (temporary)
echo ""
echo -e "${YELLOW}Test 5: Update Password${NC}"
TEST_PASSWORD="test123"
UPDATE_PW_RESPONSE=$(curl -s -X PUT "$API_URL/auth/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newUsername\":null,\"newPassword\":\"$TEST_PASSWORD\"}")

if echo "$UPDATE_PW_RESPONSE" | grep -q "message"; then
  echo -e "${GREEN}✓ Update password successful${NC}"
  
  # Verify new password works
  echo "  Verifying new password..."
  NEW_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")
  
  if echo "$NEW_LOGIN" | grep -q "token"; then
    NEW_TOKEN=$(echo "$NEW_LOGIN" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo -e "${GREEN}✓ New password verified - login successful${NC}"
    
    # Revert password
    echo "  Reverting password..."
    REVERT_PW=$(curl -s -X PUT "$API_URL/auth/update" \
      -H "Authorization: Bearer $NEW_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"currentPassword\":\"$TEST_PASSWORD\",\"newUsername\":null,\"newPassword\":\"$ADMIN_PASSWORD\"}")
    
    if echo "$REVERT_PW" | grep -q "message"; then
      echo -e "${GREEN}✓ Password reverted successfully${NC}"
    else
      echo -e "${RED}✗ Failed to revert password${NC}"
      exit 1
    fi
  else
    echo -e "${RED}✗ New password login failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Update password failed${NC}"
  echo "  Response: $UPDATE_PW_RESPONSE"
  exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "=========================================="




