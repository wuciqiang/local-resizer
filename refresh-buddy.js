#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_JSON_PATH = path.join(os.homedir(), '.claude.json');

// 生成随机 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 读取现有配置
let config = {};
if (fs.existsSync(CLAUDE_JSON_PATH)) {
  config = JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8'));
}

// 删除 accountUuid，设置新的 userId
delete config.accountUuid;
config.userId = generateUUID();
config.hasCompletedOnboarding = true;
config.theme = config.theme || 'dark';

// 写回配置
fs.writeFileSync(CLAUDE_JSON_PATH, JSON.stringify(config, null, 2));

console.log('✅ 已生成新的 userId:', config.userId);
console.log('📍 配置文件:', CLAUDE_JSON_PATH);
console.log('\n🎲 现在重启 Claude 并输入 /buddy 来查看你的新宠物！');
console.log('💡 如果不满意，再次运行此脚本重新刷新');
