#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_JSON_PATH = path.join(os.homedir(), '.claude.json');
const NEW_UID = '56fd89b7fa56ac7bfb9932ace5efab804310b06b9054d1279c0726d32336aaaa';

console.log('📍 配置文件路径:', CLAUDE_JSON_PATH);

// 读取配置
const config = JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8'));

// 删除 accountUuid，设置 userId
delete config.accountUuid;
config.userId = NEW_UID;

// 写回
fs.writeFileSync(CLAUDE_JSON_PATH, JSON.stringify(config, null, 2));

console.log('✅ 已设置 userId:', NEW_UID);
console.log('');
console.log('⚠️  重要提示：');
console.log('1. 如果你用的是官方 Claude Code CLI，需要设置环境变量：');
console.log('   export CLAUDE_CODE_OAUTH_TOKEN=<你的token>');
console.log('2. 然后重启 Claude 并输入 /buddy');
console.log('');
console.log('如果还是不行，可能你用的不是官方 Claude Code，而是第三方实现。');
