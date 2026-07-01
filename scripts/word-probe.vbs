' word-probe.vbs — quick check that Word COM is available.
Option Explicit
On Error Resume Next
Dim wordApp
Set wordApp = CreateObject("Word.Application")
If Err.Number <> 0 Then
    WScript.Echo "NO"
    WScript.Quit 1
End If
wordApp.Quit 0
WScript.Echo "OK"
WScript.Quit 0
