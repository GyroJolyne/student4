@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0" || exit /b 1
title 本地作品集
node -e "const fs=require('node:fs');eval(fs.readFileSync(process.argv[1],'utf8').split(/^\/\/ START-JS\r?$/m)[1])" "%~f0"
if errorlevel 1 pause
exit /b

// START-JS
const { spawn, execSync } = require('node:child_process');
const url = 'http://127.0.0.1:4184/';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function isPortfolio() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500), redirect: 'error' });
    if (response.ok && (await response.text()).includes('id="creator-world"')) return true;
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') return false;
  }
  throw new Error('4184 端口已有其他服务或响应超时。请稍后重试。');
}

function openWebsite() {
  execSync('start "" ' + url, { windowsHide: true });
}

(async () => {
  if (await isPortfolio()) {
    openWebsite();
    return;
  }
  const server = spawn(process.execPath, ['server.mjs'], {
    stdio: 'inherit', env: { ...process.env, PORT: '4184' }
  });
  process.once('exit', () => server.kill());
  process.once('SIGINT', () => process.exit(0));
  for (let attempt = 0; attempt < 50; attempt++) {
    await wait(100);
    if (await isPortfolio()) {
      console.log('作品集已打开。浏览时请保留此窗口，关闭窗口即可停止本次预览。');
      openWebsite();
      return;
    }
    if (server.exitCode !== null) break;
  }
  throw new Error('网站启动失败，请查看上方提示。');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});