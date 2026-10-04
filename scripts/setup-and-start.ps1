[CmdletBinding()]
param(
	[ValidateSet("Electron", "Web")]
	[string]$Mode = "Electron",
	[switch]$InstallOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ElectronProject = Join-Path $Root "apps\electron"
$ElectronPackage = Join-Path $ElectronProject "package.json"
$ElectronCache = Join-Path $env:LOCALAPPDATA "electron\Cache"

function Write-Step([string]$Message) {
	Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
	Write-Host "    $Message" -ForegroundColor Green
}

function Fail([string]$Message) {
	Write-Host "`n[失败] $Message" -ForegroundColor Red
	throw $Message
}

function Get-CommandPath([string]$Name) {
	$command = Get-Command $Name -ErrorAction SilentlyContinue
	if ($command) { return $command.Source }
	return $null
}

function Invoke-Pnpm([string[]]$Arguments, [string]$WorkingDirectory = $Root) {
	Push-Location $WorkingDirectory
	try {
		if ($script:PnpmMode -eq "direct") {
			& $script:PnpmPath @Arguments | Out-Host
		} else {
			& $script:CorepackPath pnpm @Arguments | Out-Host
		}
		return [int]$LASTEXITCODE
	} finally {
		Pop-Location
	}
}

function Get-Sha256String([string]$Value) {
	$sha = [System.Security.Cryptography.SHA256]::Create()
	try {
		$bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
		return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").ToLowerInvariant()
	} finally {
		$sha.Dispose()
	}
}

function Get-ElectronVersion {
	$package = Get-Content -LiteralPath $ElectronPackage -Raw -Encoding utf8 | ConvertFrom-Json
	$specifier = [string]$package.devDependencies.electron
	$match = [regex]::Match($specifier, "\d+\.\d+\.\d+")
	if (-not $match.Success) { Fail "无法从 apps/electron/package.json 读取 Electron 版本：$specifier" }
	return $match.Value
}

function Get-ElectronArch {
	$arch = [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture.ToString()
	switch ($arch) {
		"X64" { return "x64" }
		"Arm64" { return "arm64" }
		"X86" { return "ia32" }
		default { Fail "暂不支持的 Windows 架构：$arch" }
	}
}

function Test-ElectronReady {
	return Test-Path -LiteralPath (Join-Path $ElectronProject "node_modules\electron\dist\electron.exe")
}

function Get-MirrorCandidates([string]$Version, [string]$Arch) {
	$file = "electron-v$Version-win32-$Arch.zip"
	$mirrors = @(
		"https://npmmirror.com/mirrors/electron/",
		"https://registry.npmmirror.com/-/binary/electron/",
		"https://mirrors.huaweicloud.com/electron/",
		"https://github.com/electron/electron/releases/download/"
	)
	return $mirrors | ForEach-Object {
		$base = $_.TrimEnd("/") + "/"
		[PSCustomObject]@{
			Base = $base
			Url = $base + "v$Version/$file"
			File = $file
		}
	}
}

function Find-CachedElectronZip([string]$FileName) {
	if (-not (Test-Path -LiteralPath $ElectronCache)) { return $null }
	return Get-ChildItem -LiteralPath $ElectronCache -Recurse -File -Filter $FileName -ErrorAction SilentlyContinue |
		Sort-Object Length -Descending |
		Select-Object -First 1
}

function Get-CacheKeyForUrl([string]$ArtifactUrl) {
	$uri = [Uri]$ArtifactUrl
	$directory = $uri.AbsolutePath.Substring(0, $uri.AbsolutePath.LastIndexOf("/"))
	$base = "$($uri.Scheme)://$($uri.Host)"
	if ($uri.Port -gt 0 -and $uri.Port -ne 80 -and $uri.Port -ne 443) { $base += ":$($uri.Port)" }
	return Get-Sha256String ($base + $directory)
}

function Prepare-ElectronCache($Candidate) {
	$cached = Find-CachedElectronZip $Candidate.File
	if (-not $cached) { return $false }

	$cacheKey = Get-CacheKeyForUrl $Candidate.Url
	$targetDir = Join-Path $ElectronCache $cacheKey
	$target = Join-Path $targetDir $Candidate.File
	if (-not (Test-Path -LiteralPath $target)) {
		New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
		try {
			New-Item -ItemType HardLink -Path $target -Target $cached.FullName -ErrorAction Stop | Out-Null
		} catch {
			Copy-Item -LiteralPath $cached.FullName -Destination $target -Force
		}
		Write-Ok "已复用 Electron 缓存：$($cached.FullName)"
	} else {
		Write-Ok "Electron 下载包已在缓存中"
	}
	return $true
}

function Test-DownloadUrl([string]$Url) {
	try {
		$response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 12
		return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
	} catch {
		return $false
	}
}

function Select-ElectronMirror([string]$Version, [string]$Arch) {
	foreach ($candidate in (Get-MirrorCandidates $Version $Arch)) {
		if (Test-DownloadUrl $candidate.Url) { return $candidate }
	}
	return $null
}

function Needs-Install([string]$Project, [switch]$Electron) {
	$modules = Join-Path $Project "node_modules\.modules.yaml"
	if (-not (Test-Path -LiteralPath $modules)) { return $true }
	if ($Electron -and -not (Test-ElectronReady)) { return $true }

	$moduleTime = (Get-Item -LiteralPath $modules).LastWriteTimeUtc
	foreach ($file in @("package.json", "pnpm-lock.yaml")) {
		$path = Join-Path $Project $file
		if ((Test-Path -LiteralPath $path) -and (Get-Item -LiteralPath $path).LastWriteTimeUtc -gt $moduleTime) { return $true }
	}
	return $false
}

try {
	Set-Location $Root
	Write-Step "检测运行环境"

	$nodePath = Get-CommandPath "node.exe"
	if (-not $nodePath) { Fail "未找到 Node.js，请安装 Node.js 22.12 或更高版本后重试。" }
	$nodeVersionText = (& $nodePath --version).Trim().TrimStart("v")
	try { $nodeVersion = [version]$nodeVersionText } catch { Fail "无法识别 Node.js 版本：$nodeVersionText" }
	if ($nodeVersion -lt [version]"22.12.0") { Fail "当前 Node.js 为 $nodeVersionText，Electron 39 需要 Node.js 22.12 或更高版本。" }
	Write-Ok "Node.js $nodeVersionText"

	$script:PnpmPath = Get-CommandPath "pnpm.cmd"
	$script:CorepackPath = Get-CommandPath "corepack.cmd"
	if ($script:PnpmPath) {
		$script:PnpmMode = "direct"
		$pnpmVersionText = (& $script:PnpmPath --version).Trim()
	} elseif ($script:CorepackPath) {
		$script:PnpmMode = "corepack"
		$pnpmVersionText = (& $script:CorepackPath pnpm --version).Trim()
	} else {
		Fail "未找到 pnpm 或 Corepack，请先安装 Node.js 并启用 Corepack。"
	}
	Write-Ok "pnpm $pnpmVersionText"

	$electronVersion = Get-ElectronVersion
	$electronArch = Get-ElectronArch
	$electronFile = "electron-v$electronVersion-win32-$electronArch.zip"
	$cached = Find-CachedElectronZip $electronFile
	$offlineCache = [bool]$cached
	$mirror = if ($cached) { Get-MirrorCandidates $electronVersion $electronArch | Select-Object -First 1 } else { Select-ElectronMirror $electronVersion $electronArch }

	if ($mirror) {
		$env:ELECTRON_MIRROR = $mirror.Base
		$env:npm_config_electron_mirror = $mirror.Base
		$env:NPM_CONFIG_ELECTRON_MIRROR = $mirror.Base
		if ($offlineCache) { Write-Ok "Electron 镜像不可用，将复用本地缓存" } else { Write-Ok "Electron 镜像：$($mirror.Base)" }
	} else {
		Write-Host "    当前无法访问预设 Electron 镜像。" -ForegroundColor Yellow
	}

	New-Item -ItemType Directory -Path $ElectronCache -Force | Out-Null
	$env:ELECTRON_CACHE = $ElectronCache
	$env:electron_config_cache = $ElectronCache
	if ($env:HTTP_PROXY -or $env:HTTPS_PROXY -or $env:http_proxy -or $env:https_proxy) {
		$env:ELECTRON_GET_USE_PROXY = "true"
		Write-Ok "检测到代理，Electron 下载将使用代理"
	}

	$cacheReady = $false
	if ($mirror) { $cacheReady = Prepare-ElectronCache $mirror }
	if (-not $cacheReady -and $cached) {
		$cacheReady = $true
		Write-Ok "找到本地 Electron 缓存：$($cached.FullName)"
	}

	$projects = @(
		$Root,
		(Join-Path $Root "apps\core"),
		(Join-Path $Root "packages\fs"),
		$ElectronProject
	)
	$needsInstall = $projects | Where-Object { Test-Path (Join-Path $_ "package.json") } | Where-Object { Needs-Install $_ } | Select-Object -First 1
	if ($needsInstall) {
		Write-Step "安装项目依赖"
		$exitCode = Invoke-Pnpm @("install", "--frozen-lockfile", "--prefer-offline", "--config.confirmModulesPurge=false") $Root
		if ($exitCode -ne 0) { Fail "项目依赖安装失败。请检查网络后再次双击本脚本。" }
	} else {
		Write-Ok "项目依赖已就绪，跳过安装"
	}

	if (-not (Test-ElectronReady)) {
		Write-Step "准备 Electron 客户端"
		$exitCode = Invoke-Pnpm @("--filter", "@noname/electron", "rebuild", "esbuild", "electron") $Root
		if ($exitCode -ne 0) { Fail "Electron 客户端准备失败。请检查网络、代理或 Electron 缓存后再次双击本脚本。" }
	}

	if (-not (Test-ElectronReady)) { Fail "Electron 二进制仍未准备好。请确认 Electron 镜像可访问，或将 $electronFile 放入 $ElectronCache。" }
	Write-Ok "Electron $electronVersion 已准备好"

	if ($InstallOnly) {
		Write-Host "`n依赖安装完成。下次可直接双击 start-electron.bat 启动。" -ForegroundColor Green
		exit 0
	}

	Write-Step $(if ($Mode -eq "Web") { "启动网页开发环境" } else { "启动 Electron 开发环境" })
	$exitCode = if ($Mode -eq "Web") { Invoke-Pnpm @("dev") $Root } else { Invoke-Pnpm @("dev") $ElectronProject }
	if ($exitCode -ne 0) { Fail "开发环境已退出，退出码：$exitCode" }
} catch {
	Write-Host "`n$($_.Exception.Message)" -ForegroundColor Red
	Write-Host "`n按任意键关闭窗口..." -ForegroundColor Yellow
	$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
	exit 1
}
