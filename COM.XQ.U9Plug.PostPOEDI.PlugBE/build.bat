@echo off
echo build start...
if exist "%~dp0build.log" (del /Q "%~dp0build.log")
%windir%\Microsoft.NET\Framework\v2.0.50727\msbuild.exe "E:\UFIDA\PlugBE\Code\COM.XQ.U9Plug.PostPOEDI.PlugBE\COM.XQ.U9Plug.PostPOEDI.PlugBE\COM.XQ.U9Plug.PostPOEDI.PlugBE.csproj" /t:Clean;Rebuild /p:WarningLevel=0;Configuration=Release 
echo build end