#define Dependency_NoExampleSetup
#define UseDotNet50Desktop
#define UseNetCoreCheck
#include "CodeDependencies.iss"

#define MyAppSetupName 'Barcino Maps Update Setup'
#define MyAppVersion '0.1'


[Setup]
AppName=Barcino Maps Update
AppVersion=1.0
DefaultDirName={localappdata}\Barcino Maps Update
DefaultGroupName=Barcino
UninstallDisplayIcon={app}\BarcinoMapsUpdate.exe
Compression=lzma2
SolidCompression=yes
OutputDir=Output
OutputBaseFilename={#MyAppSetupName}-{#MyAppVersion}
ArchitecturesInstallIn64BitMode=x64


[Files]
Source: "app\BarcinoMapsUpdate.exe"; DestDir: "{app}"
Source: "app\BarcinoMapsUpdate.dll"; DestDir: "{app}"
Source: "app\BarcinoMapsUpdate.runtimeconfig.json"; DestDir: "{app}"
Source: "app\Newtonsoft.Json.dll"; DestDir: "{app}"
Source: "src\netcorecheck.exe"; Flags: dontcopy noencryption
Source: "src\netcorecheck_x64.exe"; Flags: dontcopy noencryption

[Icons]
Name: "{group}\Barcino Maps Update"; Filename: "{app}\BarcinoMapsUpdate.exe"




[Code]
procedure InitializeWizard;
begin
  Dependency_InitializeWizard;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := Dependency_PrepareToInstall(NeedsRestart);
end;

function NeedRestart: Boolean;
begin
  Result := Dependency_NeedRestart;
end;

function UpdateReadyMemo(const Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
begin
  Result := Dependency_UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo);
end;

function InitializeSetup: Boolean;
begin
  Dependency_AddDotNet50Desktop;
  Result := True;
end;


