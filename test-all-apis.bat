@echo off
echo Testing all APIs with curl...
set BASE_URL=http://localhost:5000
set EMAIL=test@example.com
set PASSWORD=Test123!

echo 1. Health check
curl -s -w "%%{http_code}\n" -o NUL %BASE_URL%/api/health

echo 2. Register new user
curl -s -X POST %BASE_URL%/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}" ^
  -w "%%{http_code}\n" -o NUL

echo 3. Login (get token)
curl -s -X POST %BASE_URL%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}" ^
  -w "%%{http_code}\n" | findstr token ^> token.txt
for /f "tokens=2 delims=:," %%a in ('type token.txt ^| findstr token') do set TOKEN=Bearer %%a
del token.txt
echo Token ready: %TOKEN:~0,20%...

echo 4. Get current user
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/auth/me -w "%%{http_code}\n" -o NUL

echo 5. Vault summary
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/vault/summary -w "%%{http_code}\n" -o NUL

echo 6. List sessions
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/sessions -w "%%{http_code}\n" -o NUL

echo 7. Create session
curl -s -X POST %BASE_URL%/api/sessions ^
  -H "Authorization: %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"founder_context\":\"Test idea\"}" ^
  -w "%%{http_code}\n" | findstr id ^> session_id.txt
for /f "tokens=2 delims=:," %%a in ('type session_id.txt ^| findstr id') do set SESSION_ID=%%a
del session_id.txt
echo Session ID: %SESSION_ID%

echo 8. Get session
curl -s -H "Authorization: %TOKEN%" "%BASE_URL%/api/sessions/%SESSION_ID%" -w "%%{http_code}\n" -o NUL

echo 9. Global tasks
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/tasks/global -w "%%{http_code}\n" -o NUL

echo 10. Company profile GET
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/company-profile -w "%%{http_code}\n" -o NUL

echo 11. Create company profile
curl -s -X POST %BASE_URL%/api/company-profile ^
  -H "Authorization: %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Corp\",\"description\":\"Test company\"}" ^
  -w "%%{http_code}\n" -o NUL

echo 12. Proxy: Boardroom vault summary
curl -s -H "Authorization: %TOKEN%" %BASE_URL%/api/boardroom/api/vault/summary -w "%%{http_code}\n" -o NUL

echo 13. Proxy: Boardroom health
curl -s %BASE_URL%/api/boardroom/healthz -w "%%{http_code}\n" -o NUL

echo All tests completed! Check for 2xx codes above.
echo Note: Run cleanup if needed: DELETE /api/sessions/%SESSION_ID% (manual)
pause

