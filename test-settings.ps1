# Test script for Admin Settings functionality (PowerShell)
# This script tests the Settings API endpoints

$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:5000/api" }
$ADMIN_USERNAME = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { "admin" }
$ADMIN_PASSWORD = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "admin123" }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Admin Settings API Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API URL: $API_URL"
Write-Host "Admin Username: $ADMIN_USERNAME"
Write-Host ""

$TOKEN = ""

# Test 1: Login
Write-Host "Test 1: Admin Login" -ForegroundColor Yellow
try {
    $loginBody = @{
        username = $ADMIN_USERNAME
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        $TOKEN = $loginResponse.token
        Write-Host "[PASS] Login successful" -ForegroundColor Green
        Write-Host "  User ID: $($loginResponse.user.id)"
        Write-Host "  Username: $($loginResponse.user.username)"
        Write-Host "  Token: $($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..."
    } else {
        Write-Host "[FAIL] Login failed: No token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get current user info
Write-Host ""
Write-Host "Test 2: Get Current Admin User Info" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    $userInfo = Invoke-RestMethod -Uri "$API_URL/auth/me" -Method Get -Headers $headers
    
    if ($userInfo.username) {
        Write-Host "[PASS] Get current user successful" -ForegroundColor Green
        Write-Host "  User ID: $($userInfo.id)"
        Write-Host "  Username: $($userInfo.username)"
        Write-Host "  Created At: $($userInfo.createdAt)"
        $CURRENT_USERNAME = $userInfo.username
    } else {
        Write-Host "[FAIL] Get current user failed: Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Get current user failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Verify token
Write-Host ""
Write-Host "Test 3: Verify Token" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    $verifyResponse = Invoke-RestMethod -Uri "$API_URL/auth/verify" -Method Get -Headers $headers
    
    if ($verifyResponse.valid -eq $true) {
        Write-Host "[PASS] Token verification successful" -ForegroundColor Green
        Write-Host "  User ID: $($verifyResponse.user.id)"
        Write-Host "  Username: $($verifyResponse.user.username)"
    } else {
        Write-Host "[FAIL] Token verification failed: Invalid token" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Token verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Update username (temporary)
Write-Host ""
Write-Host "Test 4: Update Username" -ForegroundColor Yellow
$TEST_USERNAME = "admin_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    $updateBody = @{
        currentPassword = $ADMIN_PASSWORD
        newUsername = $TEST_USERNAME
        newPassword = $null
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$API_URL/auth/update" -Method Put -Headers $headers -Body $updateBody
    
    if ($updateResponse.user.username -eq $TEST_USERNAME) {
        Write-Host "[PASS] Update username successful" -ForegroundColor Green
        Write-Host "  Old Username: $CURRENT_USERNAME"
        Write-Host "  New Username: $($updateResponse.user.username)"
        
        if ($updateResponse.token) {
            $TOKEN = $updateResponse.token
            Write-Host "  New token received"
        }
        
        # Revert username
        Write-Host "  Reverting username..."
        $revertBody = @{
            currentPassword = $ADMIN_PASSWORD
            newUsername = $CURRENT_USERNAME
            newPassword = $null
        } | ConvertTo-Json
        
        $revertResponse = Invoke-RestMethod -Uri "$API_URL/auth/update" -Method Put -Headers $headers -Body $revertBody
        
        if ($revertResponse.user.username -eq $CURRENT_USERNAME) {
            if ($revertResponse.token) {
                $TOKEN = $revertResponse.token
            }
            Write-Host "[PASS] Username reverted successfully" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] Failed to revert username" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[FAIL] Update username failed: Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Update username failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Update password (temporary)
Write-Host ""
Write-Host "Test 5: Update Password" -ForegroundColor Yellow
$TEST_PASSWORD = "test123"
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    $updateBody = @{
        currentPassword = $ADMIN_PASSWORD
        newUsername = $null
        newPassword = $TEST_PASSWORD
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$API_URL/auth/update" -Method Put -Headers $headers -Body $updateBody
    
    if ($updateResponse.message) {
        Write-Host "[PASS] Update password successful" -ForegroundColor Green
        
        # Verify new password works
        Write-Host "  Verifying new password..."
        $verifyLoginBody = @{
            username = $ADMIN_USERNAME
            password = $TEST_PASSWORD
        } | ConvertTo-Json
        
        $verifyLogin = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $verifyLoginBody -ContentType "application/json"
        
        if ($verifyLogin.token) {
            $NEW_TOKEN = $verifyLogin.token
            Write-Host "[PASS] New password verified - login successful" -ForegroundColor Green
            
            # Revert password
            Write-Host "  Reverting password..."
            $revertHeaders = @{
                "Authorization" = "Bearer $NEW_TOKEN"
                "Content-Type" = "application/json"
            }
            
            $revertBody = @{
                currentPassword = $TEST_PASSWORD
                newUsername = $null
                newPassword = $ADMIN_PASSWORD
            } | ConvertTo-Json
            
            $revertResponse = Invoke-RestMethod -Uri "$API_URL/auth/update" -Method Put -Headers $revertHeaders -Body $revertBody
            
            if ($revertResponse.message) {
                Write-Host "[PASS] Password reverted successfully" -ForegroundColor Green
            } else {
                Write-Host "[FAIL] Failed to revert password" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "[FAIL] New password login failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[FAIL] Update password failed: Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Update password failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All tests passed!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

