密麻麻 MiMaMa - 产品需求文档（最终合并版）
==================================================
来源：ChatGPT(8轮,105K+字符) + Gemini(23轮) 深度调研合并
版本：v1.0-Final | 日期：2026-04-13
状态：可直接作为开发参考规格文档
==================================================
# 第一章：产品定义与品牌策略

## 1.1 产品定位
密麻麻（MiMaMa）是一款面向中国市场的**密码管理工具**，支持微信小程序、Android、iOS 三端。采用**混合架构**：微信小程序使用腾讯云数据库存储，Android 和 iOS 客户端保持纯本地加密存储。核心理念：**数据安全可控，用户知情选择**——小程序端数据加密存储于腾讯云，客户端数据完全在本地，用户可根据隐私偏好灵活选择。

公式：**本地优先 + 微信伴侣 + 二维码桥接 + 极快复制返回**

## 1.2 品牌名称讨论

### ChatGPT 推荐方案（按优先级排序）
1. **密来来（MiLaiLai）**⭐首选 — "密来了"暗示密码自动到来，友好感强，无负面联想
2. **密码匣（MiMaMa）** — 功能清晰，"匣"传递安全容器感，但可能显得老旧
3. **密库（MiKu）** — 简短有力，但域名/商标可能已被占用

### ChatGPT 对"密麻麻"的评估
- ❌ "密密麻麻"在中文语境中暗示"密集/杂乱/堆砌"，与安全产品需要的"干净/精确/可控"调性冲突
- ⚠️ 双关记忆点虽强，但品牌联想方向偏离安全

### Gemini 推荐方案
- ✅ 密麻麻（MiMaMa）— 利用"密密麻麻"双关，记忆点强

### 综合建议
最终选择需福尔摩斯决策。ChatGPT倾向"密来来"，Gemini倾向"密麻麻"。本PRD暂以"密麻麻"为工作名称。

## 1.3 目标用户画像
| 类型 | 描述 | 痛点 |
|------|------|------|
| 一线白领 | 25-40岁，50+在线账号 | 密码重复使用，忘记密码频繁 |
| 微信重度用户 | 日均3+小时 | PC/手机密码不同步 |
| 游戏玩家 | 多平台账号 | 每个游戏都需要独立密码 |
| 家庭IT管理员 | 管理父母/孩子的账号 | 需要安全共享家庭密码 |
| 隐私关注者 | 不信任云端服务 | 拒绝使用1Password等云端方案 |

## 1.4 核心价值主张
1. **隐私可控**：客户端零服务器架构，数据永不离开用户设备；小程序端数据加密存储于腾讯云，用户充分知情且可自主选择
2. **微信生态**：行业首款支持微信小程序的密码管理器
3. **中国定制**：身份证/银行卡/医保卡/统一社会信用代码管理
4. **大厂美学**：Apple/微信/支付宝级别的UI品质

## 1.5 差异化策略（7大支柱）
| 支柱 | 说明 | 竞品对比 |
|------|------|---------|
| 本地优先 | 客户端零服务器，数据不出库 / 小程序端腾讯云加密存储 | 1P/Bitwarden依赖云端 |
| 中国账户现实 | 手机号/邮箱/验证码作为主ID | 西方产品以email为主 |
| 小程序伴侣 | 微信内复制→返回，2秒完成 | 无任何竞品支持 |
| 中国原生导入 | 从备忘录/微信文件助手/Excel导入 | 仅支持CSV |
| 中国UX语言 | 账号/密码/动态码/备份码 | username/password/vault |
| 中国风险模式 | 手机号作密码检测、身份证到期提醒 | 通用安全审计 |
| 家庭多身份设计 | 个人/家庭/工作多保险箱 | 仅1Password支持 |

## 1.6 竞品对比矩阵
| 维度 | 1Password | Bitwarden | 密麻麻 MiMaMa |
|------|-----------|-----------|---------------|
| 数据存储 | 云端服务器 | 可选自托管 | **纯本地** |
| 微信小程序 | ❌ | ❌ | **✅** |
| 中国证件管理 | 有限 | 有限 | **深度定制** |
| UI风格 | 西方数据库风 | 开发者工具风 | **中国大厂卡片风** |
| 多保险箱 | ✅ | ❌ | **✅** |
| Decoy Vault | ❌ | ❌ | **✅** |
| Panic Lock | ❌ | ❌ | **✅** |
| Travel Mode | ✅ | ❌ | **✅** |
| 定价 | $35.88/年 | 免费+$10/年 | **Freemium** |
| 核心卖点 | 团队协作 | 开源透明 | **客户端不出库 / 小程序端腾讯云** |

## 1.7 Top 5 核心用户场景
| 场景 | 痛点 | 解决方案 |
|------|------|---------|
| 新App注册 | "就用邮箱密码吧"→弱密码重复 | 密码生成器一键创建强密码+兼容模式 |
| PC到手机跳转 | 密码在手机但正在PC登录 | QR码加密桥接传输 |
| 身份证查询 | 买票/住酒店需身份证但不在手边 | 加密证件卡片+一键复制 |
| 家庭共享 | 配偶共享会员账号密码 | 安全分享（一次性链接+4位取件码） |
| 换机迁移 | 新设备需转移200个密码 | .mimama加密备份+WebDAV同步 |

## 1.8 定价策略
**Freemium 模式：**
- 免费版：50条记录 + 本地同步 + 基础安全审计
- Pro版：无限记录 + WebDAV/iCloud同步 + 多保险箱 + Decoy Vault + Panic Lock + Travel Mode + 证件OCR
- 中国市场定价：Pro版一次性¥28或¥18/年（远低于1Password）


# 第二章：核心功能集

## 2.1 保险库与组织
- **多保险箱架构**：个人(👤蓝)/家庭(🏠绿)/工作(💼灰)/隐藏(🌙紫灰)/诱饵(独立隔离)
- **结构化模板**：微信/游戏/银行卡/身份证/邮箱/工作/自定义安全备注
- **标签与文件夹**：嵌套文件夹 + 彩色标签，拖拽排序
- **收藏/置顶**：标记常用密码
- **自定义字段**：每个条目无限键值对

## 2.2 安全基础
- **零知识加密**：AES-256-GCM + Argon2id 密钥派生（4层纵深防御）
- **主密码 + 数据密钥双层架构**：修改主密码无需重新加密整个数据库
- **生物识别快速解锁**：FaceID/TouchID/指纹（包装主密码，不替代）
- **自毁机制**：可配置失败次数(5/10/20次)后清除数据
- **剪贴板自动清除**：密码30s/OTP 20s/银行卡身份证60s，差异化超时
- **越狱/Root检测**：三级响应(低风险仅警告/中风险禁用截屏缩短锁定/高风险禁用自动填充)
- **Panic Lock**：连续5次点击/特殊PANIC PIN(000258)/摇一摇，可配置动作
- **Decoy Vault**：诱饵PIN→打开包含普通密码的假保险箱
- **Travel Mode**：隐藏敏感数据（银行卡/OTP/证件/恢复码），定时3/7/14天提醒
- **任务页隐藏**：系统任务切换器中模糊应用内容

## 2.3 2FA/OTP系统
- **TOTP密钥存储**：QR扫描导入+手动Base32输入
- **智能复制策略**：>7s直接复制 / 3-7s弹选择 / ≤2s自动等待下一组
- **倒计时三段式**：30-11s正常(细圆环) / 10-4s强调(脉冲) / 3-0s警告("即将刷新")
- **备份码保护**：默认隐藏，需二次生物识别才可查看
- **禁用HOTP**（首版不做）

## 2.4 本地同步方案
- **WebDAV同步**（坚果云/Nextcloud/Synology/自定义）
- **iCloud同步**（iOS）/ **Google Drive同步**（Android）
- **加密.mimama备份**：ZIP(vault.db + metadata.json + attachments/)
- **QR桥接同步**：原生App↔小程序，challenge-response模式，30-60秒有效期
- **冲突解决**：库级检测→条目级合并→字段级对比，默认"保留两个版本"

## 2.5 系统级自动填充
- **iOS**：Credential Provider扩展 + QuickType栏 + Safari保存
- **Android**：AutofillService + 8.0+/11+/14+版本适配 + 国产ROM兼容
- **Android悬浮窗**：300dp x 400dp可拖拽迷你密码库（仅用于破坏自动填充的旧App/游戏/WebView）
- **银行/支付/系统设置页面自动抑制悬浮窗**

## 2.6 密码生成器（独立Tab）
- 长度滑块：8-64 字符
- **3种兼容模式**：银行保守(8-16位仅字母数字)/电商通用(10-20位允许!@#$%_.)/开发者高强度(16-32位全字符集+增强规则)
- 开关：大写/小写/数字/特殊符号/排除易混淆字符
- 等宽字体语法高亮（数字蓝/符号绿/字母白）
- 最近生成历史（5条）

## 2.7 安全审计
- 全局安全分数（0-100），环形进度条
- 检测项：弱密码/重复密码/过期密码(>90天)/泄露密码(Have I Been Pwned k-Anonymity)
- 密码强度规则：避免重复>2次/连续序列/服务名片段/用户名片段/手机号作密码
- 一键修复流程

## 2.8 数据导入/导出
- **导入**：1Password/Bidwarden/LastPass/Chrome CSV + 通用CSV + 字段映射UI + 冲突解决(保留/跳过/合并)
- **导出**：TXT（结构化ENTRY BEGIN/END格式）/ CSV（UTF-8 BOM）/ PDF（仿真档案）/ HTML（离线密匣）
- **导出安全**：全屏警告 + 长按3秒确认 + 泄露途径说明
- **导出选项**：包含备注/自定义字段/密码掩码模式

## 2.9 微信小程序特有
- 6位PIN独立认证（禁简单序列/5次失败冷却/8次失败重新配对/12小时重新验证）
- 加密QR桥接同步原生App数据
- "Copy & Minimize" + "Copy & Stay"
- 安全分享（一次性链接+4位取件码，1小时有效，仅1次查看）
- 截屏防护：wx.setVisualEffectOnCapture + 水印叠加
- 敏感操作需二次PIN验证

## 2.10 回收站
- 删除先入回收站，30天自动彻底清除
- 恢复/立即删除/清空回收站

## 2.11 批量操作
- 长按多选模式：批量删除/移动到分类/导出/收藏
- 底部浮动操作栏

## 2.12 微信安全分享
- 端到端加密 + 链接过期 + 限次查看 + 取件码分离传递
- 发送方3步：选择字段→设置规则→生成分享
- 接收方：打开链接→输入取件码→一次查看→关闭不可再开
- 禁止分享：动态验证码/恢复码/主密码/私钥
- 发送方可随时撤销"立即失效"


# 第三章：设计系统 - 色彩

## 3.1 品牌主色
**Primary: #176B87**（深青蓝 teal-blue）
- 设计理念：蓝绿混合，传达"安全+冷静+保护"
- 与微信绿(#07C160)、支付宝蓝(#1677FF)做了三色区隔
- 在安全领域少见，辨识度高

### 与Gemini方案的对比
| 维度 | ChatGPT #176B87 | Gemini #0052D9 |
|------|-----------------|----------------|
| 色调 | 青蓝teal | 纯蓝 |
| 感觉 | 冷静、保护、沉稳 | 权威、稳定、科技 |
| 差异化 | ✅ 安全领域罕见 | ❌ 腾讯同色 |

## 3.2 完整色板

### 品牌与功能色
| 用途 | 色值 | 说明 |
|------|------|------|
| Primary | #176B87 | 品牌色、主按钮、激活态 |
| Primary Light | #2892B3 | 标签背景、选中高亮 |
| Primary Dark | #0F4E63 | 按钮按压态 |
| Secondary | #5B7CFA | 辅助操作、链接 |
| Success | #16A34A | 密码有效、已复制、保存成功 |
| Warning | #F59E0B | 过期密码、弱安全警报 |
| Error | #DC2626 | 泄露警报、认证失败、破坏性操作 |
| Info | #2563EB | 通用系统提示 |

### 亮色模式中性色
| 用途 | 色值 | 说明 |
|------|------|------|
| Background | #F6F8FA | 主背景 |
| Surface | #FFFFFF | 卡片、面板 |
| Card | #FFFFFF | 内容卡片 |
| Border | #E3E8EF | 分割线、卡片边框 |
| Text Primary | #0F172A | 标题、正文 |
| Text Secondary | #475569 | 说明、副标题 |
| Text Disabled | #94A3B8 | 禁用态、占位符 |

### 暗色模式中性色（OLED优化）
| 用途 | 色值 | 说明 |
|------|------|------|
| Background | #000000 | 纯黑OLED |
| Surface | #0B0F14 | 一级面板 |
| Card | #131A22 | 内容卡片 |
| Elevated | #1C2430 | 悬浮层 |
| Border | #243140 | 分割线 |
| Text Primary | #F8FAFC | 标题 |
| Text Secondary | #CBD5E1 | 说明 |

## 3.3 色彩使用规则
- 主色占屏幕面积 < 10%（克制感）
- 错误红仅用于：弱密码警告、破坏性操作、泄露风险
- 成功绿仅用于：保存成功、安全评分、备份完成
- 警告黄用于：密码即将过期、中等风险
- 不可逆操作分级：低风险Toast / 中风险弹窗 / 高风险全屏警告

## 3.4 语义色映射
| 状态 | 图标 | 颜色 | 形状 |
|------|------|------|------|
| 弱密码 | 三角 | 琥珀#F59E0B | △ |
| 强密码 | 盾牌+勾 | 绿#16A34A | 🛡✓ |
| 已泄露 | 警告八边形 | 红#DC2626 | ⚠ |
| 信息提示 | i圆形 | 蓝#2563EB | ⓘ |


# 第四章：设计系统 - 字体、图标、布局、动画

## 4.1 字体系统
- **iOS**: PingFang SC / **Android**: Noto Sans SC / Source Han Sans
- **英文**: Inter（全局）/ SF Mono(iOS)/JetBrains Mono(Android)（密码/OTP）
- **OTP专用**: 20px / font-weight 600 / 等宽 / letter-spacing +0.3px

### 字号层级
| 级别 | 大小 | 字重 | 行高 | 用途 |
|------|------|--------|------|------|
| H1 (Display) | 32px | Bold (700) | 1.2 | 大页面标题 |
| H2 (Section) | 20px | Semibold (600) | 1.3 | 区块标题 |
| H3 (Subsection) | 17px | Semibold (600) | 1.35 | 子区块 |
| Body Large | 16px | Regular (400) | 1.5 | 密码标题、用户名 |
| Body Small | 14px | Regular (400) | 1.5 | 设置、元数据 |
| Caption | 12px | Regular (400) | 1.4 | 标签、时间戳 |
| Micro | 11px | Medium (500) | 1.3 | 按钮内文字 |
| Password | 15px | Medium (500) | 1.4 | 密码字段 |
| OTP Code | 20px | Semibold (600) | 1.0 | 动态验证码 |

## 4.2 图标系统
- **默认**：线形图标 (outline)
- **激活**：填充图标 (filled)
- **描边宽度**：1.75px (16px图标) / 1.5px (20px图标)
- **圆角**：round cap/join
- **视觉隐喻**：盾牌、锁、钥匙孔、竹编纹理
- **最小点击目标**：44x44pt (iOS) / 48x48dp (Android)

## 4.3 布局系统
- **网格**：4列移动网格，8pt间距系统，4pt微调
- **基准宽度**：iPhone 375px / Android 360px
- **侧边距**：16px
- **组间距**：24px
- **卡片间**：12px
- **表单字段间**：16px
- **卡片圆角**：16px（不同于Gemini的12px）
- **按钮高度**：52px
- **导航栏高度**：56px（比Gemini的84px更紧凑）
- **Tab高度**：56px + 安全区
- **密码卡片高度**：76px min
- **统计栏高度**：84px

## 4.4 组件规格

### 输入框
- 高度：52px
- 圆角：10px
- 内边距：16px
- 边框：1px #E3E8EF
- 聚焦边框：2px #176B87
- 错误边框：2px #DC2626
- 字号：16px Regular

### 按钮
- 主按钮：高度52px / 圆角12px / 背景#176B87 / 文字白色 / 字号16px Semibold / letter-spacing +0.2px
- 次按钮：高度52px / 圆角12px / 背景#FFFFFF / 边框1px #E3E8EF / 文字#176B87
- 幽灵按钮：高度52px / 圆角12px / 透明背景 / 文字#176B87
- 危险按钮：高度52px / 圆角12px / 背景#DC2626 / 文字白色
- 禁用态：opacity 0.4 / 不可点击

### 卡片阴影
- 标准：0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
- 悬浮：0 4px 12px rgba(0,0,0,0.08)
- FAB：0 8px 24px rgba(23,107,135,0.3)

## 4.5 动画与微交互

### 缓动函数
| 类型 | cubic-bezier | 用途 |
|------|-------------|------|
| 标准弹出 | (0.2, 0, 0, 1) | Bottom Sheet、Modal |
| 标准收回 | (0.4, 0, 0.2, 1) | 关闭动画 |
| 弹性 | (0.34, 1.56, 0.64, 1) | FAB按钮、图标变形 |
| 解锁 | (0.16, 1, 0.3, 1) | 解锁过渡 |

### 7个关键微交互
1. **保险柜解锁脉冲**：生物识别触发→锁图标1.05x缩放+触觉反馈→背景模糊淡出300ms→列表交错滑入(每项50ms)
2. **复制反馈**：图标变形为绿色对勾✅1.5秒后恢复
3. **密码揭示（幽灵揭示）**：圆点和明文交叉淡入淡出+模糊过渡300ms
4. **OTP倒计时**：30-11s细环 / 10-4s脉冲 / 3-0s警告标签
5. **保险库切换**：图标缩小→内容淡出→新保险库图标放大→内容淡入（400ms total）
6. **骨架屏加载（Shimmer Effect）**：解锁保险库时，内容不生硬弹出，先显示Shimmer骨架卡片（#E3E8EF渐变动画从左到右扫光），0.5秒后内容淡入，营造"正在解密"的专业感
7. **彩蛋：摇一摇生成密码**：在密码生成器页面摇一摇手机，触发密码"碎裂"→"重组"为新密码的动画+骰子音效，增加趣味性和用户粘性

## 4.6 暗色模式策略
- 跟随系统 + 手动切换（跟随系统/始终亮色/始终暗色）
- OLED纯黑 #000000 背景
- 卡片深色 #131A22（非纯灰，带微蓝底调）
- 密码明文用高对比白 #F8FAFC
- 安全分数环：暗色下描边加粗至12px


# 第五章：主密码库页面（密码库主页）

## 5.1 页面结构
自上而下：状态栏 → 大标题导航栏 → 统计卡片 → 分类Pills → 密码列表 → FAB → 底部Tab

## 5.2 导航栏
- 大标题："密码库" PingFang SC, 32px Bold, 左对齐
- 右侧：搜索图标(24px) + 更多菜单(···)
- 滚动过渡：标题缩至17px居中，背景变#FFFFFF+毛玻璃模糊

## 5.3 快速统计栏（84px高）
- 水平3列等分白色卡片，12px圆角
- 左列："128" + "全部" (24px Bold + 12px #475569)
- 中列："12" + "弱密码" (24px Bold #F59E0B)
- 右列："2" + "高风险" (24px Bold #DC2626)
- 点击整栏跳转安全审计

## 5.3.5 备份状态指示灯（首页常驻预警栏）
在统计栏下方、分类筛选Pills上方，增加一个**备份状态条**，根据用户上次备份时间动态显示状态：

| 状态 | 颜色 | 图标 | 文案 | 点击行为 |
|------|------|------|------|---------|
| 近期已备份（7天内） | 绿色 #16A34A | 🟢 | "数据已安全备份" | 无（或展开备份时间） |
| 超过5条密码未备份 | 黄色 #F59E0B | 🟡 | "有5条新数据尚未备份，建议导出" | 跳转导出页 |
| 极高风险（长期未备份，>30天） | 红色 #DC2626 | 🔴 | "数据已超过30天未备份，存在丢失风险！" | 直接跳转导出页 |
| 从未备份 | 红色 #DC2626 + 脉冲动画 | 🔴 | "您尚未进行过数据备份！" | 直接跳转导出页 |

**实现规则：**
- 本地记录 `lastBackupTimestamp`，每次导出成功后更新
- 每次 App 启动时检查一次，每次新增/修改密码后触发一次
- 黄色/红色状态时，指示灯有轻微脉冲动画（opacity 0.6→1.0→0.6，1.5s循环）
- 用户点击红色/黄色指示灯后，直接跳转到"导出"流程（资产盘点页）
- 指示灯高度：36px，与分类Pills同级视觉层级，不可关闭/不可永久隐藏

## 5.4 分类筛选Pills
- 横向滚动，999px圆角(pill胶囊形)
- 预置：全部/社交/支付/邮箱/工作/收藏
- 选中态：背景#EAF6FA + 文字#176B87（非实心填充，保持克制感）
- 未选中态：背景#E3E8EF + 文字#475569
- 高度：32px, 内边距16px

## 5.5 密码卡片列表（76px min height）
- 白色背景#FFFFFF, 圆角16px, 边框1px #E3E8EF
- 外边距：16px(左右), 8px(上下)
- **左**：44x44px应用图标（10px圆角），无图标时自动生成彩色圆形+首字母
- **中上**：标题(16px Semibold #0F172A)
- **中下**：账号名(13px #475569)
- **右侧**：安全状态文字标签（"安全"/"弱"/"风险"）+ 快速复制图标
- **底行**：掩码密码 ••••••••• + "3天前更新"(12px #94A3B8)

### 滑动手势
| 手势 | 操作 | 视觉 |
|------|------|------|
| 左滑短距 | 收藏 | 蓝色背景+星标图标 |
| 左滑长距 | 删除 | 红色背景+垃圾桶，72px宽 |
| 右滑 | 分享 | 灰色背景+分享图标 |

### 空状态
- 居中空保险库插画（竹编盾牌风格）
- "还没有保存的密码"
- 主按钮"添加第一个密码" + 副按钮"从其他工具导入"

## 5.6 FAB悬浮按钮
- 位置：右下角(距边24px)
- 尺寸：56x56px, 圆形, #176B87
- 图标：白色"+"号
- 阴影：0 8px 24px rgba(23,107,135,0.3)

## 5.7 底部Tab导航（56px高+安全区）
4个Tab：**密码库**/分类/审计/设置
- 选中：图标+文字#176B87
- 未选中：图标+文字#94A3B8
- 背景：白色80%透明+背景模糊

### 注意：ChatGPT与Gemini差异
ChatGPT把"审计"作为第3个Tab（而非"生成器"），因为安全审计是更核心功能。密码生成器放在密码库内联和添加密码页内。

## 5.8 Stitch UI 设计提示词

> "Mobile App UI Design, Password Manager Main Vault screen, iOS style, clean professional aesthetic with 'big company' quality. Large Title '密码库' in 32px Bold PingFang SC left-aligned. Below, a horizontal 3-column stats card (84px height, 16px radius): left shows '128' count in 24px Bold with '全部' subtitle, center shows '12' in amber #F59E0B with '弱密码', right shows '2' in red #DC2626 with '高风险'. Below stats, a horizontal scroll of pill-shaped category filters (999px radius, 32px height): '全部' '社交' '支付' '邮箱' '工作' '收藏'. Selected pill has #EAF6FA background with #176B87 text. Below, a vertical list of white cards (16px radius, 1px #E3E8EF border, 76px min height, 16px horizontal margin). Each card: 44x44px app icon (10px radius) on left, title in 16px Semibold #0F172A, account in 13px #475569, security status label ('安全' green/'弱' amber/'风险' red) and copy icon on right. Bottom navigation: 56px height with 4 tabs (密码库/分类/审计/设置), selected tab #176B87. Background #F6F8FA. 56px circular FAB in bottom-right corner with #176B87 background, white '+' icon, shadow 0 8px 24px rgba(23,107,135,0.3). 4pt grid system, premium quality, high fidelity 4k."

> "Mobile UI Component: Single password item card, 375px width. White background #FFFFFF, 16px rounded corners, 1px #E3E8EF border. Left: 44px square WeChat green icon with 10px radius. Center-top: '微信' in 16px Semibold #0F172A. Center-bottom: 'mimama_user' in 13px #475569. Right: security status pill '安全' in green with shield icon, plus a blue #176B87 copy icon 24px. Bottom line: masked password '•••••••••' in grey #94A3B8 and '3天前更新' in 12px. Clean typography, high contrast, 4k resolution."

> "Mobile App UI Design, Dark Mode Password Manager Vault. Background pure black #000000 for OLED optimization. Cards are deep charcoal #131A22 with 16px radius and 1px #243140 border. Text: title in #F8FAFC, subtitle in #CBD5E1, disabled in #64748B. Stats card: #131A22 background. Selected pill: dark teal background. FAB: #176B87 with glow effect. Bottom nav: #0B0F14 background. Sleek, modern, premium security aesthetic. 4k."


# 第六章：添加/编辑密码页面 + 密码生成器

## 6.1 添加密码页面

### 导航栏
- 左："取消"(14px #475569) / 居中："添加密码"(18px Semibold) / 右："保存"(14px #176B87，未完成时禁用#94A3B8)

### 模板选择器（Bottom Sheet）
- 20px圆角顶部，白色背景
- 2列网格：网站账号(🌐)/银行卡(💳)/邮箱(📧)/游戏(🎮)/身份证(🪪)/安全备注(🔐)/自定义(✏️)
- 每项80x80px图标+中文标签

### 表单分组（16px圆角白色卡片，组间距24px）

**组1 - 基本信息：**
- 服务名称：左侧40x40px圆形图标占位(输入时动态品牌匹配) + 52px输入框
- 分类：下拉选择器

**组2 - 凭证信息：**
- 用户名：52px输入框，编辑模式右侧复制图标
- 密码：52px输入框 + 右侧眼睛图标(揭示) + 魔法棒图标(生成器)
- 密码强度条：6px高4段式
  - 段1 红#DC2626 / 段2 琥珀#F59E0B / 段3 绿#16A34A / 段4 蓝#176B87

**组3 - 附加信息：**
- 网址：52px输入框+外部链接图标
- 标签：横向滚动可删除chips
- 备注：96px multiline输入框，背景#F6F8FA

**组4 - 自定义字段（动态）：**
- "添加自定义项目"虚线按钮(>+键值对)
- 每行：标签名+值+是否机密开关+删除

### 内联密码生成器面板
- 底部滑起，20px圆角顶部
- 密码展示：等宽字体JetBrains Mono 24px，语法高亮（数字#176B87/符号#16A34A/字母#F8FAFC/小写#94A3B8）
- 长度滑块：8-64字符，#176B87，实时数值
- 4个iOS Toggle：大写/小写/数字/特殊符号
- "使用此密码"按钮(#176B87实心52px)

### 表单验证
- 错误：边框#DC2626 + 12px提示"此项必填"
- 保存成功：双击触觉+页面下滑+Toast"已安全存入保险箱"
- 删除：红色"删除该记录"按钮+系统确认弹窗

## 6.2 密码生成器（独立Tab+内联版）

### 兼容模式（ChatGPT独有）
顶部Segmented Control切换3种模式：

| 模式 | 长度 | 字符集 | 禁止 |
|------|------|--------|------|
| 银行保守 | 8-16 | 仅字母+数字 | 所有特殊字符, O/0/I/l/1 |
| 电商通用 | 10-20 | 字母+数字+!@#$%_. | 空格/引号/斜杠 |
| 开发者高强度 | 16-32 | 全字符集 | 重复>2次/连续序列/服务名片段/用户名片段 |

### 面板规格
- 显示区：#131A22深色方框(16px圆角, 80px高)
- 滑块：#176B87, 轨道6px, 范围8-64, 默认16
- 字符集预览：当前模式允许的字符集合小字显示
- 操作：主按钮"复制并保存"(#176B87 52px) / 副按钮"仅复制"
- 历史：最近5条，掩码+时间+长度标签

### 彩蛋：摇一摇生成密码（Gemini融合）
- 在密码生成器页面摇一摇手机，触发随机生成新密码
- **动画效果**：当前密码"碎裂"为字符碎片→碎片在空中"重组"为新密码→落位动画（总计600ms）
- **音效**：骰子摇晃+落定音效（可在设置中关闭）
- **设计目的**：增加趣味性，提升用户对生成器的使用频率和产品粘性
- **触发限制**：间隔>2秒才可再次触发，避免连续误触

## 6.3 Stitch UI 设计提示词

> "Mobile App UI, 'Add Password' screen, iOS aesthetic, premium quality. Top navigation: '取消' left in 14px #475569, '添加密码' center 18px Semibold, '保存' right in 14px #176B87. Background #F6F8FA. Grouped white cards (16px radius) with 24px group spacing. Group 1 '基本信息': 40x40px icon placeholder with 52px service name input. Group 2 '凭证信息': 52px username input with copy icon, 52px password input with eye toggle and magic wand icon. Below password: 4-segment strength bar (6px height): red #DC2626 / amber #F59E0B / green #16A34A / blue #176B87. Group 3: URL with external link icon, scrollable tag chips, 96px notes area with #F6F8FA background. Group 4: dashed '添加自定义项目' button. 8pt grid, PingFang SC font, high fidelity 4k."

> "Mobile UI Design, Bottom Sheet Template Picker. Half-height modal with 20px rounded top corners. Title '选择模板'. 2x3 grid: 网站账号(🌐), 银行卡(💳), 邮箱(📧), 游戏(🎮), 身份证(🪪), 安全备注(🔐). Each item: 80x80px rounded-rect icon + Chinese label in 14px #475569. Semi-transparent dark backdrop. Clean, modern, #176B87 accents, 4k."

> "UI Component: Password Generator Panel. Bottom-aligned slide-up with 20px rounded top corners, white background. Large generated password in 24px JetBrains Mono with syntax highlighting: numbers in #176B87, symbols in #16A34A, uppercase in #F8FAFC, lowercase in #94A3B8. Below: #176B87 thickness slider (6px track, 8-64 range, value displayed). Three mode tabs: '银行保守' '电商通用' '开发者' in segmented control. Four iOS-style toggle switches: ABC, abc, 123, #$&. Extra 'Exclude similar characters' toggle. Character set preview in small grey text below toggles. Primary button '使用此密码' in solid #176B87 (52px height, 12px radius). High-end utility design, 4k."

> "Mobile UI Design, Password Generator Standalone Tab. Header: '密码生成器' in 20px Semibold. At top, three mode tabs in segmented control: 银行保守 / 电商通用 / 开发者. Display Area: large #131A22 dark rounded box (16px radius, 80px height) with generated password in 24px monospace. Right side: copy + refresh icons. Controls: #176B87 slider for length (8-64). Four toggles for character types. 'Recent' section showing 3 partially masked passwords. Background #F6F8FA. Premium, tool-like aesthetic, 4k."


# 第七章：解锁页面 + 引导流程

## 7.1 解锁页面

### 视觉设计
- **背景**：上次密码库界面高斯模糊(24px blur) + 毛玻璃覆盖层(16px圆角白色半透明面板, 居中326px宽)
- **品牌名**："密麻麻" 20px Semibold
- **副标题**："解锁你的密码库" 14px #475569
- **生物识别按钮**：112x112px圆形, #176B87, 呼吸光晕效果
- **主密码输入**：触发后滑出52px输入框 + 眼睛图标
- **底部**："忘记主密码？"文字链接 + "本地加密，不上传云端"信任声明

### 失败反馈
- 1-2次：密码圆点水平抖动 + 双击触觉振动
- 3次起：红色文字"还剩{N}次尝试，之后将抹除所有数据"
- 达到阈值：自毁→清除数据库→跳转恢复密钥页面

### 成功动画
生物识别成功→锁图标"咔哒"1.05x缩放+触觉→背景模糊淡出300ms→列表交错滑入(每项50ms)

## 7.2 Stitch UI 提示词

> "Mobile UI, Unlock Screen for MiMaMa security app. Deeply blurred background (Gaussian blur 24px) of a password list. Overlaid with a crisp white frosted glass panel (326px wide, 16px radius, centered). Panel content: brand name '密麻麻' in 20px Semibold, subtitle '解锁你的密码库' in 14px #475569. Center: large 112x112px circular #176B87 fingerprint icon with breathing glow animation (pulsing opacity 0.5→1.0→0.5). Below icon: '忘记主密码?' text link in 14px #475569. At very bottom of panel: small text '本地加密，不上传云端' in 12px #94A3B8. The overall aesthetic is premium, secure, cinematic. Dark mode: black frosted glass. OLED friendly. 4k, 8pt grid."

## 7.3 引导流程（5步）

### Step 1：欢迎页
- 白色#F6F8FA背景，居中**3D粘土风格竹编盾牌插画**（带柔和阴影，非扁平化）
- 插画风格说明：采用3D粘土(Clay)渲染风格，竹编纹理形成密集交错的盾牌形状，平衡安全产品的压抑感，更具现代感和溢价感
- 品牌名"MiMaMa"（#176B87, 24px Bold）
- 标语："您的隐私，坚若磐石"（14px #475569）
- 主按钮"开启安全之旅"（#176B87实心, 52px高, 24px圆角）
- 顶部2px进度条（20%）

### Step 2：数据存储说明（混合架构）+ 冷酷声明

标题："你的数据，由你做主"
核心说明："密麻麻采用混合架构：微信小程序端数据加密存储于腾讯云数据库，Android/iOS 客户端数据完全保存在您的本地设备上。小程序端即使换机也不丢失，客户端端绝不触碰云端。"
三个图标说明：📱 小程序端: 腾讯云加密存储 / 💻 客户端端: 纯本地存储 / 🔒 应用层 AES-256-GCM 加密

**"可持续隐私"声明（必须勾选才能继续）：**
- 复选框1（数据风险）：`我已明白：小程序端数据存储于腾讯云，客户端端数据仅存在于本机设备，卸载客户端 App 会导致客户端数据永久丢失，我需要养成定期导出的习惯。`
- 复选框2（广告契约）：`我理解密麻麻通过导出时的广告收益维持研发，我愿意在导出备份时观看广告以支持隐私计划。`
- 两个复选框**均未勾选** → "下一步"按钮禁用（灰色，不可点击）
- **两个均勾选** → 按钮变为品牌色 #176B87，可点击
- 设计目的：复选框2建立用户心理契约，提前告知广告存在和目的，降低后续看到广告时的反感度

三个图标说明：📱 小程序端: 腾讯云加密存储 / 💻 客户端端: 纯本地存储 / 🔒 应用层 AES-256-GCM 加密


- 标题："我们不存储你的密码"
- 三图标说明：🔒 本地加密 / ☁️ 无服务器 / 🔑 只有你持有密钥
- "我了解了"按钮（#176B87）

### Step 3：设置主密码
- 大型52px白色输入框(16px圆角) + 眼睛图标
- 4段强度条：红#DC2626(弱) / 琥珀#F59E0B(一般) / 绿#16A34A(强) / 蓝#176B87(极高)
- 未达标时提示：⚠️至少8位 / ⚠️包含大小写字母 / ⚠️包含数字或特殊符号
- "下一步"按钮（必须达到绿色才可点击）

### Step 4：恢复密钥（关键步骤）
- 标题："保存恢复密钥"
- 副标题："忘记主密码时，你只能通过恢复密钥找回保险库"
- 恢复码展示：`A7KD-3MPL-X92Q-T8WN-R4YC-U6HF`（24字符6组4位，等宽字体，强调卡片背景）
- 上方标签："仅显示一次，请妥善保存"
- 3种保存方式按钮卡片：保存到照片 / 复制到剪贴板(10秒自动清除) / AirDrop分享
- 危险提示框："密麻麻不会保存你的主密码，也无法帮你重置"
- 确认勾选："我已将恢复密钥保存在安全的地方" → 未勾选主按钮禁用
- 支持重新生成（需确认弹窗）

### Step 5：生物识别（可选）
- Demo动画：手机轮廓+面容扫描光圈+保险库解锁微动(2-3秒循环)
- 标题："启用 Face ID" / "启用指纹解锁"
- 文案："使用生物识别即可快速进入密麻麻。你的主密码不会被替代，在关键操作时仍需验证。"
- 主按钮"立即启用"（调起系统授权） / "暂不启用"
- 成功反馈：轻弹层"已启用Face ID，下次打开可直接使用"

## 7.4 Stitch UI 提示词

> "A minimalist, premium onboarding screen for MiMaMa password manager. Visual: Center a 3D clay-style illustration of a blue-and-silver bamboo-woven shield with soft drop shadow. Text: Below image, brand name 'MiMaMa' in #176B87 (24px Bold) and tagline '您的隐私，坚若磐石' in 14px #475569. Actions: large full-width '开启安全之旅' button in #176B87 with white text (52px height, 24px radius). A 2px progress bar at top showing 20%. Background #F6F8FA. Apple-level whitespace and polish. 4k, 8pt grid."

> "Mobile UI, Master Password setup screen for MiMaMa. Title '设置主密码' 20px Semibold with sub-text '此密码是解锁所有数据的唯一钥匙' in 14px #475569. Single large white input field (52px height, 16px radius) with show/hide eye icon. Below: 4-segment strength bar (6px height per segment): Segment 1 red #DC2626 (弱), Segment 2 amber #F59E0B (一般), Segment 3 green #16A34A (强), Segment 4 blue #176B87 (极高). Security tips in 13px #475569 with amber warnings. Footer: '下一步' button disabled/grey until green reached. Background #F6F8FA. High fidelity."

> "Mobile UI, Recovery Key page. Title '保存恢复密钥' in 20px Semibold. Subtitle '忘记主密码时，你只能通过恢复密钥找回保险库' in 14px #475569. Center: large recovery code 'A7KD-3MPL-X92Q-T8WN-R4YC-U6HF' in monospace font, 24px, 6 groups of 4 characters, on an emphasized card background. Small label above: '仅显示一次，请妥善保存'. Copy button top-right. Three save method cards: '保存到照片', '复制到剪贴板', 'AirDrop'. Danger box: '密麻麻不会保存你的主密码，也无法帮你重置'. Confirmation checkbox: '我已将恢复密钥保存在安全的地方' - button disabled until checked. '下一步' primary button. #176B87 accent, #F6F8FA background. 4k."


# 第八章：安全审计 + 密码详情 + 搜索页面

## 8.1 安全审计页面

### 安全分数环
- 位置：页面顶部居中
- 直径：144px，描边：10px
- 进度颜色：红(0-40) / 琥珀(41-70) / 绿(71-90) / 蓝#176B87(91-100)
- 中心数字：82 (34px Bold #0F172A) + "安全分"(14px #475569)
- 摘要文本："整体状态良好，建议优先修复高风险问题"
- 加载动画：环形从0填充到实际分数(800ms ease-out)

### 问题卡片（132x92px，水平排列）
- 已泄露：红色#DC2626图标 + "2" + "已泄露"
- 弱密码：琥珀#F59E0B图标 + "12" + "弱密码"
- 重复使用：蓝色#176B87图标 + "8" + "重复使用"

### 筛选Pills
全部 / 高风险 / 弱密码 / 重复

### 问题列表
- 白色卡片(12px圆角)，每项：
  - 左：44px网站图标
  - 中上：服务名(16px Semibold)
  - 中下：问题描述(13px #475569)如"密码已泄露，建议立即修改"
  - 右："去修复"按钮(36px高, 10px圆角, #176B87)

### Stitch提示词
> "Create a high-fidelity Security Audit Dashboard. Top-centered circular progress ring (144px diameter, 10px stroke) showing score 82 in blue #176B87 progress, #E3E8EF track. Center: '82' in 34px Bold #0F172A, '安全分' in 14px #475569, summary text '整体状态良好，建议优先修复高风险问题'. Below: three horizontal cards (132x92px, 12px radius): '已泄露 2' red #DC2626, '弱密码 12' amber #F59E0B, '重复使用 8' blue #176B87. Below: filter pills (全部/高风险/弱密码/重复). Problem list: white cards with 44px icon, service name '微博' 16px Bold, '密码已泄露，建议立即修改' 13px #475569, '去修复' button 36px #176B87. Background #F6F8FA. Premium quality, 4k."

## 8.2 密码详情页

### 头部区域
- 返回按钮 <
- 居中：64x64px应用图标(14px圆角) + 服务名称(20px Bold) + URL副标题(13px #475569, 可点击)

### 字段卡片
**卡片1 - 凭证信息：**
- 用户名：标签12px #94A3B8 + 值16px #0F172A + 右侧蓝色复制图标
- 密码：标签 + 掩码••••••••• + 眼睛图标(揭示) + 蓝色复制图标
- 静默规则：密码默认隐藏，点按显示8-12秒后自动重新掩码

**卡片2 - 附加信息：**
- 网址 + 外部链接图标
- 备注：多行文本#0F172A，背景#F6F8FA
- 自定义字段：标签:值的键值对列表
- 2FA区域：6位OTP码(20px Semibold) + 倒计时环 + 复制按钮

**卡片3 - 元信息：**
- 创建/修改时间 + 分类标签

### 底部操作栏（固定）
4按钮网格：📋 复制用户名 / 🔑 复制密码 / 🌐 打开链接 / ↗️ 分享
全宽主按钮："编辑密码" (#176B87)

### 密码历史（可折叠手风琴）
最近3个版本：旧密码(掩码)+修改时间+"恢复此版本"按钮，折叠动画300ms

### Stitch提示词
> "Mobile UI, Password Detail view for MiMaMa. Top: back arrow, center-aligned 64x64px app icon (14px radius) + 'GitHub' in 20px Bold + 'https://github.com' in 13px #475569. Main content: white cards (16px radius) on #F6F8FA. Card 1 '凭证': username field with blue copy icon, password with '•••••••••' dots + eye toggle + copy icon. Card 2: URL with external link, notes in #F6F8FA background, custom key-value fields, OTP section with 6-digit code in 20px Semibold + countdown ring + copy button. Card 3: metadata timestamps + category tags. Bottom fixed bar: 4-button grid (Copy Username, Copy Password, Open URL, Share) in ghost style + full-width '编辑密码' button #176B87. Collapsible '密码历史' accordion. Clean, professional, 8pt grid, 4k."

## 8.3 搜索页面（覆盖层）

### 搜索栏
- 高度：36px, 白色背景#FFFFFF, 10px圆角
- 左：搜索图标(#94A3B8) / 右：清除图标(输入后出现) + "取消"
- Placeholder："搜索账号或备注"

### 搜索增强（ChatGPT独有）
- **拼音首字母搜索**：输入"xhs"可匹配"小红书"
- **中文别名匹配**：同一App的多种叫法（RED/小红书/XHS）
- 实时过滤：<50ms (1000+条目)

### 筛选Chips
全部 / 全部类型 / 高安全强度 / 最近修改 / 收藏

### 搜索结果
- 72px高卡片：40px图标 + 标题16px + URL副标题12px #94A3B8 + 右箭头>
- 空状态：120x120px灰色插画 + "未找到匹配的账号"

### Stitch提示词
> "Create a search overlay screen for MiMaMa. Top: search bar (36px height, white #FFFFFF, 10px radius) with search icon and '搜索账号或备注' placeholder. Below: recent search tags in grey #E3E8EF pills: '淘宝' 'Gmail' 'GitHub' '小红书'. Sticky filter chips: '全部类型' '高安全强度' '最近修改' '收藏'. Results: vertical list of white cards (16px radius, 72px height). Each: 40px app icon, title 16px #0F172A, URL 12px #94A3B8, right chevron. Background #F6F8FA. Primary #176B87. Fast, clean, professional. 4k."


# 第九章：分类管理 + 证件管理

## 9.1 分类管理页面

### 列表布局
- 垂直列表，白色卡片(16px圆角, 高64px, 1px #E3E8EF边框)
- 左：32px彩色圆角图标
- 中：分类名称(16px Semibold) + 子项数量(13px #94A3B8)如 "社交 · 23个"
- 右：拖拽手柄 ⠿

### 预置分类
| 分类 | 图标 | 颜色 |
|------|------|------|
| 全部 | 🏠 | 蓝 #176B87 |
| 社交 | 💬 | 蓝 #5B7CFA |
| 游戏 | 🎮 | 紫 #7C3AED |
| 金融 | 💳 | 绿 #16A34A |
| 购物 | 🛒 | 橙 #F59E0B |
| 证件 | 🪪 | 红 #DC2626 |
| 邮箱 | 📧 | 蓝 #2563EB |
| 工作 | 💼 | 灰 #475569 |

### 交互
- 长按：拖拽排序模式(所有项Z轴抬升+抖动)
- 左滑：编辑(修改名称/图标/颜色)
- 右滑：删除(确认弹窗，条目移至"未分类")
- 点击：进入该分类下过滤视图
- 底部："+ 添加新分类"(全宽52px按钮)

### Stitch提示词
> "UI design for category management in MiMaMa. Vertical list on #F6F8FA background. White cards (16px radius, 64px height, 1px #E3E8EF border). Each row: 32px colorful rounded icon on left, title in 16px Semibold #0F172A, count '23个' in 13px #94A3B8, grey drag handle on right. Preset categories: 社交(💬blue), 游戏(🎮purple), 金融(💳green), 购物(🛒orange), 证件(🪪red). Full-width '+ 添加新分类' button in #176B87 at bottom. Clean, organized, 8pt grid, PingFang SC. 4k."

## 9.2 证件管理 / 数字钱包

### 模板网格（2列卡片）
- 12px圆角白色卡片，上方图标+下方标题
- 身份证 🪪 / 银行卡 💳 / 护照 🛂 / 医保卡 🏥 / 驾驶证 🚗 / 自定义 ✏️
- "+"扫描新证件卡片(虚线边框+相机图标)

### 身份证详情
- 正面/反面切换：底部Segmented Control
- 字段：姓名/性别/民族/出生日期/地址 + 身份证号(一键复制)/签发机关/有效期
- 照片存储：正面/反面缩略图(加密)，点击全屏
- OCR扫描："扫描身份证"按钮→相机→自动识别填充
- 到期提醒：30天内红色徽章"即将到期"

### 银行卡详情
- 仿真银行卡视觉(渐变背景+卡号掩码+持卡人名)
- 字段：卡号(一键复制)/持卡人/银行名称/支行/CVV(默认掩码)
- 到期提醒：30天前推送通知

### Stitch提示词
> "Digital wallet UI for MiMaMa. 2-column grid of rounded cards (12px radius) on #F6F8FA: 身份证🪪, 银行卡💳, 护照🛂, 医保卡🏥, 驾驶证🚗. Plus a dashed-border '扫描新证件' card with camera icon. Below grid: bank card detail view showing simulated credit card with gradient background, masked number '**** **** **** 8888', cardholder name. Quick-copy buttons for card number and CVV. Professional, trustworthy, #176B87 accent. 4k."


# 第十章：设置页面

## 10.1 页面布局
iOS风格分组列表，白色卡片在#F6F8FA背景上。每组间距24px，卡片圆角16px。

### 顶部账户区
头像(40px圆形) + "MiMaMa" + "本地加密·当前设备"

## 10.2 完整设置项（ChatGPT 10组40+项）

### 组1：安全（11项）
| 项目 | 图标 | 右侧 |
|------|------|------|
| 主密码/PIN | 🔒 蓝色 | > |
| 生物识别 | 👆 蓝色 | Toggle |
| 自动锁定 | ⏱️ 蓝色 | "5分钟" |
| 剪贴板自动清除 | 📋 蓝色 | "密码30s/OTP 20s" |
| 截屏保护 | 👁️ 蓝色 | Toggle |
| 任务页隐藏 | 🔲 蓝色 | Toggle |
| 诱饵保险库 | 🎭 紫色 | > |
| 紧急锁定 | 🚨 红色 | > |
| 旅行模式 | ✈️ 蓝色 | > |
| 单独解锁 | 🔑 蓝色 | > |
| 安全检查 | 🛡️ 绿色 | > |

### 组2：动态验证码（7项）
| 项目 | 右侧 |
|------|------|
| 复制行为 | ">7s直接复制" |
| 过期自动等待 | Toggle |
| 返回原应用 | Toggle |
| 备份码保护 | Toggle |
| 排序方式 | "按使用频率" |
| 倒计时样式 | "三段式" |

### 组3：保险库（7项）
| 项目 | 右侧 |
|------|------|
| 当前保险库 | "个人" |
| 管理保险库 | > |
| 默认启动保险库 | "个人" |
| 隐藏入口 | Toggle |
| 颜色与图标 | > |
| 跨保险箱规则 | > |
| 保险箱锁定策略 | > |

### 组4：数据与同步（9项）
| 项目 | 右侧 |
|------|------|
| 同步方式 | "WebDAV" |
| 服务器地址 | "dav.jianguoyun.com" |
| 路径 | "/dav/mimama" |
| 上次同步 | "今天 10:45" |
| 自动同步 | Toggle |
| 冲突处理 | "保留两个版本" |
| 同步版本 | "v3" |
| 连接测试 | > |
| 重新鉴权 | > |

⚠️ **永久红色警告（不可关闭、不可忽略）：**
> "本软件客户端端为纯本地存储，卸载 App 将导致所有本地数据永久抹除且无法恢复，请定期导出备份。小程序端数据存储于腾讯云，不受此限制。"
> - 样式：红色背景(#FEF2F2)、红色文字(#DC2626)、左侧红色感叹号图标、16px圆角
> - 位置：固定在"数据与同步"组底部，"导入导出"组上方
> - 行为：不可关闭、不可左滑删除、每次进入设置页都会显示

### 组5：导入导出（8项）
| 项目 | 右侧 |
|------|------|
| 导入数据 | > |
| 导出为TXT | > |
| 导出为Excel | > |
| 导出为HTML密匣 | > |
| 导出为PDF档案 | > |
| 导出加密备份 | > |
| 导出选项 | > |
| 数据备份 | > |
| 从备份恢复 | > |

### 组6：外观（7项）
| 项目 | 右侧 |
|------|------|
| 深色模式 | 分段控件(跟随/亮色/暗色) |
| 强调色 | > |
| 界面密度 | 分段控件(标准/紧凑) |
| 布局风格 | > |
| 字号缩放 | "100%" |
| 高对比度 | Toggle |
| 图标风格 | "线形" |

### 组7：通知（4项）
安全提醒 / 到期提醒 / 同步异常 / 渠道管理

### 组8：关于（7项）
版本 v1.0.2 / 隐私政策 / 用户协议 / 开源许可 / 帮助中心 / 意见反馈 / 分享给朋友

### 组9：危险操作（5项，红色区域）
清除搜索历史 / 清空回收站 / 销毁所有数据 / 退出登录 / 删除账户

## 10.3 Stitch提示词
> "Mobile UI, Settings page for MiMaMa. Top account area: 40px circular avatar + 'MiMaMa' + '本地加密·当前设备'. Grouped white cards (16px radius) on #F6F8FA background, 24px group spacing. Group '安全': items with colorful rounded-square icons (24px) - blue lock for '主密码', blue fingerprint toggle for '生物识别', blue timer '自动锁定' showing '5分钟', blue clipboard '剪贴板自动清除' showing '密码30s', purple mask '诱饵保险库', red alarm '紧急锁定'. Group '同步': green cloud 'WebDAV同步' showing '已连接·坚果云'. Group '导入导出'. Group '外观': moon icon + segmented '跟随系统/亮色/暗色'. Group '危险操作' in red-tinted section. All text in #0F172A, secondary in #475569. Clean, comprehensive, 8pt grid. 4k."


# 第十一章：数据导入页面（7个页面）

## 11.1 来源选择页
- 标题："导入数据"（20px Semibold）
- 说明："将其他密码管理器或浏览器中的账号数据导入到密麻麻。导入不会覆盖原文件。"
- 底部提示："导入文件仅在本机处理，不会上传至服务器。"
- 5个来源卡片（品牌图标+名称+"支持 .csv 文件"）：
  1Password(Bidwarden)/LastPass/Chrome/通用CSV
- 每个卡片：左侧品牌图标，中间来源名称，下方"支持 .csv"，右侧Chevron>

## 11.2 文件选择页
- 标题："选择导入文件"
- 大卡片拖放区（虚线边框，80px高）：文件/上传图标+"选择 CSV 文件"+"支持从文件、微信、浏览器下载目录中选择"
- 按钮："选择文件" + "查看示例格式"
- 选择后显示文件卡片：文件名 + 大小 + 修改时间
- 底部："下一步"按钮(#176B87)

## 11.3 字段映射页（核心页）
- 标题："字段对应"
- 说明："请确认源文件字段与密麻麻字段的对应关系。未匹配的字段将作为备注或自定义字段导入。"
- 顶部固定提示条：已识别来源/共识别列/自动匹配成功/待确认
- 左右双列映射卡片（每行一个）：
  - 左：源字段名（如login_username）
  - 中：→ 箭头
  - 右：MiMaMa目标字段Dropdown（标题/网址/用户名/邮箱/手机号/密码/备注/分类/标签/收藏/TOTP/银行卡号/身份证号/自定义字段/不导入）
- 多源冲突：黄色提示"已有字段映射到'密码'，是否覆盖？"
- 底部："未匹配字段将保留到备注/自定义字段" + "预览导入"按钮

## 11.4 导入预览页
- 摘要：即将导入248条 / 登录项220 / 卡证类18 / 安全项10
- 前5条预览卡片（图标+标题+用户名+网址+分类标签+TOTP徽标）
- 冲突区："发现17条可能重复的项目"
- 3种处理方式（单选）：保留两条 / 跳过重复项 / 合并并更新旧条目
- 高级冲突设置（可展开）

## 11.5 导入进度页
- 居中圆形进度环+百分比
- 5阶段动态文案：正在读取文件→正在解析字段→正在检查重复项→正在加密保存→正在生成索引
- 实时统计：总248/已处理136/成功132/跳过3/失败1
- 底部："导入过程中请勿关闭应用。所有数据仅在本机处理。"

## 11.6 导入成功页
- 盾牌+小对勾/文件飞入保险箱插图
- 统计卡片：成功导入231 / 跳过重复15 / 导入失败2 / 新增OTP 12 / 新建分类6
- 按钮："查看已导入项目" / "查看导入报告"
- 底部："建议现在进行一次安全检查，确认重要账号、银行卡和动态验证码是否正确。"
- 失败项：可展开详情（"第18行：密码字段为空" / "第42行：TOTP格式无效"）

## 11.7 Stitch提示词
> "UI for Data Import - Source Selection in MiMaMa. Title '导入数据' in 20px Semibold. Description in 14px #475569. 5 white cards (16px radius) in vertical list: 1Password (blue key icon), Bitwarden (blue shield), LastPass (purple lock), Chrome (rainbow globe), 通用CSV (grey document). Each card: brand icon left, name in 16px #0F172A, '支持 .csv 文件' in 12px #94A3B8, chevron right. Bottom tip: '导入文件仅在本机处理，不会上传至服务器。' in 12px. Background #F6F8FA. 4k."

> "UI for Import Field Mapping page. Title '字段对应'. Top sticky bar: '已识别来源: Bitwarden CSV | 共识别列: 12 | 自动匹配: 9 | 待确认: 3'. Left-right dual column mapping cards. Each row: source field (monospace) → arrow → MiMaMa target dropdown. Example mappings: name→标题, login_uri→网址, login_username→用户名, login_password→密码, notes→备注, folder→分类, totp→动态验证码. Yellow conflict alert for duplicates. Footer: '预览导入' button in #176B87. Background #F6F8FA. Clean, technical, 4k."


# 第十二章：数据导出 — 从"备份"升级为"安全仪式"

## 12.1 设计理念：导出即仪式
在"卸载即丢失"的前提下，用户的备份动力必须从"被动"转为"主动的仪式"。导出文档就是用户唯一的"数字遗产"。

## 12.2 资产盘点页（导出前必经步骤）
用户点击"导出"后，先展示**资产盘点页面**：
- 大数字居中："128"（即将导出账号总数）
- 分类统计："登录账号 98 · 银行卡 3 · 身份证件 2 · 安全备注 25"
- 安全摘要："其中 5 个弱密码、2 个已泄露密码需要关注"
- 强提醒卡片（#176B87边框）：
  - 客户端用户："您即将导出所有本地加密数据。导出文件就是您的唯一备份，建议同时选择一种物理备份方式（打印或发送至其他设备）。"
  - 小程序用户："您的数据已安全存储于腾讯云。以下导出仅用于在本地保留一份副本，以防云服务异常。"
- 底部："开始导出"按钮（#176B87实心，52px高）

## 12.2.5 网络强校验逻辑（The Gatekeeper）

用户点击"开始导出"后，系统**必须立即执行 NetworkCheck**，这是导出流程的第一道关卡。

**校验规则：**
| 网络状态 | 行为 |
|---------|------|
| 有网络 | 正常进入格式选择页 |
| 无网络/飞行模式 | 禁用所有导出格式（TXT/Excel/HTML/PDF）的点击动作 |
| 网络不稳定 | 显示黄色警告"当前网络不稳定，导出可能失败"，但允许继续 |

**无网络时引导弹窗：**
- 标题："需要网络权限"
- 正文："为了加载最新的安全加密模版并维持隐私计划的持续运行，请开启网络权限。本操作不会上传您的任何密码数据。"
- 按钮："去开启网络"（跳转系统网络设置）/ "稍后再说"（返回首页）
- 底部小字："您的密码数据始终保存在本地，仅导出模版加载需要网络。"

**设计目的：**
确保用户在导出前有网络，从而能加载激励视频广告。同时用"安全加密模版"的说法包装网络需求，而非直接说"需要网络来看广告"。

## 12.3 导出模版定义

### 模版 A：机密 PDF 档案（纸质备份版）⭐推荐
**仿真"护照/存折"排版**，不只是简单列表，而是模仿银行存折或护照的视觉设计，让用户有动力将其打印出来物理保存。
- 封面页：品牌Logo + "密麻麻：您的离线隐私档案" 大标题 + #176B87装饰线 + 生成日期水印
- 内页排版：仿真存折风格，左侧蓝色竖线装饰条，每条记录像存折的一行
- 页眉："密麻麻：您的离线隐私档案" + #176B87装饰线
- 正文：等宽字体(JetBrains Mono)工整对齐，每条记录 = 序号 + 分类标签 + 标题 + 账号/卡号(部分掩码)
- 水印：每页半透明斜排水印"密麻麻 · 机密档案"（防止拍照泄露）
- 页脚：导出时间 + 唯一设备识别码 + "请将此文件存放于安全位置"
- 裁切线（A4标准，便于裁剪装订）

### 模版 B：离线 HTML 密匣（单机查看版）
单文件 HTML，断网双击即可打开，内嵌 CSS+JS（无外部依赖）。
- 搜索框 + 美观列表卡片 + 品牌色#176B87 + 等宽字体
- "数字档案"精致感，文件≤500KB（1000条以内）
- 安全提示："此文件不联网也可查看，所有数据仅存在于您本地设备。"

### 模板 C：Excel/CSV（表格版）
UTF-8 BOM 编码，CRLF 换行。标准表格格式，适合在电脑上用 Excel/WPS 打开查看和编辑。

## 12.3.5 激励视频触发流（Monetization Flow）

**动作链条（严格按顺序执行）：**
```
用户选择格式(TXT/Excel/HTML/PDF)
  -> 唤起激励视频广告(Reward Video)
    -> 视频播放完成(Ad Callback onRewarded)
      -> 系统开始生成文件(generateFile())
        -> 生成完成 -> 唤起分享面板
```

**触发规则：**
| 导出格式 | 是否触发激励视频 |
|---------|---------------|
| PDF档案（仿真存折/护照） | ✅ 必须观看 |
| HTML密匣（离线查密码） | ✅ 必须观看 |
| Excel表格 | ✅ 必须观看 |
| TXT纯文本 | ⚠️ 首次免费，之后需观看 |

**防白嫖机制（核心）：**
- **视频播放完成后才触发 `generateFile()`**，视频未完成则绝不生成文件
- 若用户中途关闭视频（onAdClosed without reward），立即中止生成流程，回到格式选择页
- 文件生成函数与广告回调绑定，代码层面不可绕过

**心理补偿（播放完成后）：**
- 全屏精致对勾动画（1.5秒）
- 文案："感谢您的支持，您已成功资助了一次数据加密服务。您的数据依然只属于您。"
- 对勾动画结束后自动进入生成进度页

**24小时冷却机制：**
- 用户当天已看过一次激励视频 -> 后续24小时内所有导出操作**不再触发广告**
- 目的：提升好感度，避免频繁打扰
- 状态存储：本地 UserDefaults/SharedPreferences，key: `lastAdWatchTimestamp`

## 12.4 导出路径引导（渠道纯净化）
导出成功后，UI **严禁出现杂乱列表，仅两个核心操作**：

| 渠道 | 实现 |
|------|------|
| 发送至微信 | iOS/Android调起微信分享→文件传输助手/信任好友；小程序wx.shareFile |
| 系统原生分享 | iOS优先AirDrop；Android优先互传/Quick Share |

**严禁**：微博、百度网盘、QQ、邮件附件等第三方入口。

## 12.5 备份提醒算法
- 不定时提醒（用户会烦）
- **数据变动量触发**：累计5次重要密码变更后，首页小红点提醒
- 文案："您的本地备份已落后，建议导出最新安全档案。"
- 每天最多1次

## 12.6 原第12章导出内容（保留）


## 12.1 导出格式选择页（设置→导入导出→导出）
四个大卡片（垂直排列，全宽16px圆角）：
| 格式 | 图标 | 说明 |
|------|------|------|
| TXT纯文本 | 📄 蓝色 | 适合打印和保存 |
| Excel表格 | 🟢 绿色 | 适合查看和编辑 |
| HTML密匣 | 🌐 青色 | 断网也能查密码 |
| PDF档案 | 📋 品红色 | 仿真存折/护照排版，纸质备份首选 |

## 12.2 导出选项页
Toggle列表：
- ✅ 包含账号备注（默认ON）
- ✅ 包含自定义字段（默认ON）
- ✅ 包含密码（默认ON）
- ⬜ 密码掩码模式（显示为********，默认OFF）
- 底部文件名预览：`MiMaMa_Export_20260413_1305.csv`

## 12.3 导出安全警告（全屏弹窗）⚠️

### 触发条件
用户选择TXT/CSV（非加密.mmex）时触发

### 页面设计（非普通弹窗，是全屏警告页）
- 背景：浅红/暖灰危险氛围
- 左上角：关闭按钮
- 中部：打开的文件+外泄警示插图
- 主标题："你正在导出未加密内容"
- 正文："TXT或CSV文件不会被加密保护。任何拿到该文件的人，都可能直接看到你的账号、密码、备注和其他敏感信息。"
- 泄露途径4项：被聊天软件自动备份 / 被云盘同步 / 被系统搜索索引 / 被他人误打开或转发
- 高亮风险框3项：导出后内容可被直接查看 / 文件可能长期残留在设备中 / 删除文件也不一定能彻底清除痕迹
- **确认区**："请长按下方按钮3秒，确认你已了解风险。"
- **大按钮**："长按3秒继续导出"（有进度填充动画，从左到右3秒）
- 松开提示："请持续按住3秒"
- 底部："取消导出" + "推荐使用'加密备份文件'导出，更安全。"

## 12.4 导出成功页
- 绿色对勾✅图标(64px)
- 文件预览卡片：图标+文件名+大小(如"142 KB")
- 按钮："分享文件"(#176B87实心) + "完成"(幽灵)
- 底部黄色安全提示："💡 安全提示：使用完毕后请删除此文件，或确认文件存储在安全位置。"

## 12.5 TXT导出格式（ChatGPT结构化方案）
```
MiMaMa Export File
Version: 1
AppName: 密麻麻
ExportedAt: 2026-04-13 13:05:00 +08:00
Encoding: UTF-8 BOM
LineEnding: CRLF
EntryCount: 5
Warning: This file contains sensitive plaintext data.

### ENTRY BEGIN
Type: Login
Title: 微信
Account: jacky_demo
Password: Mm@2026WeChat!
Tags: 社交,常用
CustomFields: region=CN;2FA=已开启
### ENTRY END

### ENTRY BEGIN
Type: Game
Title: 原神
Account: traveler_cn_01
CustomFields: server=天空岛;uid=100123456
### ENTRY END

### ENTRY BEGIN
Type: BankCard
Cardholder: 张三
Bank: 中国工商银行
CardNumber: 6222001234567890123
### ENTRY END

### ENTRY BEGIN
Type: IdentityCard
Name: 张三
IDNumber: 110101199001011234
### ENTRY END

### ENTRY BEGIN
Type: SecureNote
CustomFields: safe_code=7-2-9-1-4-8;location=主卧衣柜上层
### ENTRY END
```

## 12.6 Stitch提示词
> "A critical security modal for MiMaMa. Full-screen danger warning (NOT a small dialog). Dimmed backdrop with warm grey/red tint. Top-left: close button. Center: illustration of an open file with leak warning icon. Bold title '你正在导出未加密内容' in 20px #DC2626. Description in 14px #475569: 'TXT或CSV文件不会被加密保护...' List of 4 leak paths in 13px. Highlighted risk box with 3 items. Bottom: a large button labeled '长按 3 秒继续导出' with progress fill animation (left-to-right over 3 seconds). If released early: '请持续按住3秒'. Secondary: '取消导出'. Bottom tip: '推荐使用加密备份文件导出，更安全。' White card center. High urgency, professional. 4k."

> "Export success screen in MiMaMa. Large green checkmark ✅ icon (64px) top center. File preview card: document icon, filename 'MiMaMa_Export_20260413_1305.csv', size '142 KB'. Two buttons: '分享文件' solid #176B87 and '完成' ghost. Yellow warning box at bottom: '💡 安全提示：使用完毕后请删除此文件。' Background #F6F8FA. 4k."


# 第十三章：微信小程序设计

## 13.1 与原生App差异总览
| 功能 | 原生App(Android/iOS) | 微信小程序 |
|------|---------|--------|
| **数据存储** | **纯本地(SQLCipher)** | **腾讯云数据库（加密）** |
| 自动填充 | ✅ 系统级 | ❌ 仅复制粘贴 |
| 生物识别 | ✅ FaceID/指纹 | ❌ 6位PIN |
| 多保险箱 | ✅ 5种 | ❌ 单保险箱 |
| 文件夹/标签 | ✅ 嵌套 | ❌ 简化 |
| 密码历史 | ✅ | ❌ |
| 截屏防护 | ✅ 系统级 | wx.setVisualEffectOnCapture+水印 |
| 数据备份 | ❌ 需手动导出 | ✅ 腾讯云自动存储 |
| 换机保留数据 | ❌ 需手动迁移 | ✅ 腾讯云自动同步 |

## 13.2 认证与PIN规则（ChatGPT极其严格）
- 6位最低，禁止简单序列(123456/654321/111111)
- 5次失败→30秒冷却 / 8次失败→重新配对原生App
- 12小时后或微信重启需重新输入PIN
- **敏感操作需二次PIN验证**（显示密码/复制密码/查看银行卡CVV）

## 13.3 QR桥接协议（ChatGPT详细版）
- QR有效期30-60秒，一次性使用
- challenge-response模式，不嵌入明文数据
- QR包含：协议版本/中继端点/nonce/过期时间/签名
- 三种场景：首次配对 / 单次获取 / 桌面登录助手(未来)
- 子集同步：仅收藏+最近50条+用户固定分类

## 13.4 小程序4个Tab
首页/保险库 → 搜索 → 常用 → 我的

## 13.5 小程序密码库主页
- 简化搜索栏（含QR扫描图标）
- 两个Tab："最近使用" + "收藏"（#176B87下划线激活态）
- 紧凑密码卡片：图标+标题+大型"复制"按钮
- FAB悬浮按钮(+图标)

## 13.6 小程序密码详情页（Copy-Paste效率优先）
- 大型"点击复制"按钮(用户名和密码各一个)
- 固定底部："复制并退出"按钮(#176B87实心)→ wx.exitMiniProgram()
- 无密码历史、无关联服务
- 密码默认隐藏，点按显示8-12秒后自动重新掩码

## 13.7 截屏策略（务实态度）
- **不依赖截屏防护作为核心控制**
- 假设截屏会发生→最小化暴露
- 密码默认隐藏→按住/定时揭示→8-12秒自动重新掩码
- 可选：水印叠加"密麻麻 · 敏感信息" + 当前时间

## 13.8 小程序分包策略
- 主包(≤1.5MB)：启动+PIN+搜索+列表
- 子包A：详情+编辑
- 子包B：导入导出
- 子包C：QR桥接

## 13.8.5 小程序端广告与导出说明

小程序端的广告和导出逻辑与原生App端**完全一致**，无任何差异化处理：

**开屏广告：**
- 每次进入小程序时触发（利用小程序加载等待时间）
- 5分钟内不重复触发

**导出广告（激励视频）：**
- 导出TXT/Excel/HTML/PDF时，同样需**强制观看激励视频广告**后方可生成文件
- 动作链条与App端一致：选择格式 -> 视频广告 -> 播放完成 -> 生成文件 -> 分享
- 24小时冷却规则同样适用
- 防白嫖机制同样适用（中途关闭不生成文件）

**分享渠道差异：**
- App端：发送至微信 / AirDrop / 系统分享
- 小程序端：wx.shareFile（保存到微信收藏/发送给朋友/文件传输助手）

**注意：** 小程序端数据已存储于腾讯云，导出仅为本地副本备份用途。

## 13.9 Stitch提示词

> "Create a simplified WeChat Mini Program Home/Vault for MiMaMa. Top: full-width white search bar (20px radius) with 'Scan QR' camera icon on right. Two tabs: '最近使用' and '收藏' with #176B87 underline active state. Vertical list of compact white cards (16px radius). Each: 40x40px brand icon, title '微信' in 16px #0F172A, large accessible '复制' ghost button in #176B87. FAB: circular 56px blue #176B87 button with white + icon. Background #F6F8FA. Clean, fast, 4k."

> "High-speed Password Detail for WeChat Mini Program. Center-aligned on #F6F8FA. Two primary white cards (16px radius). Card 1: '用户名' label + large text + full-width '点击复制' blue button. Card 2: '密码' label + masked '•••••••••' + eye toggle + '点击复制' button. Fixed bottom: large solid #176B87 button '复制并退出'. No metadata, no history. Copy-paste efficiency focused. Professional, minimal. 4k."

> "PIN Unlock for WeChat Mini Program. White background. Center: '请输入 PIN 码' title in 18px. Six 16px circle indicators filling with #176B87 as user types. Large custom numeric keypad at bottom 50%. Bottom: '使用主密码解锁' text link in 14px #94A3B8. Clean, focused. 4k."

> "QR Sync Bridge for Mini Program. Dark theme. Large square camera viewfinder with scanning line animation. Semi-transparent dark mask. Text overlay: '请将手机对准原生App显示的二维码'. Post-scan: #176B87 loading spinner + '正在解密并同步数据...' in 16px white text. Professional, technical, 4k."


# 第十四章：安全分享 + 回收站 + 批量操作

## 14.1 微信安全分享（受限中转式）

### 设计前提
纯本地无服务器→此功能引入最小化临时中转服务。端到端加密+链接过期+限次查看+取件码分离传递。

### 发送方流程（3步）
**Step 1 - 选择分享字段：**
- 内容卡片：标题+用户名(138****2231)+默认隐藏密码
- 可分享字段（复选）：用户名 ✅ / 密码 ✅ / 网址 ✅ / 备注 ✅ / 动态验证码 ❌(默认禁止)/ 自定义字段 ✅
- OTP旁提示："动态验证码为高敏感信息，默认不支持分享"

**Step 2 - 设置规则：**
- 有效期：10分钟 / 1小时(默认) / 24小时 / 自定义
- 查看次数：仅1次(默认) / 最多3次 / 最多5次
- 领取方式：链接+4位取件码(默认) / 仅链接(不推荐)
- 底部安全提示："对方打开链接后仍需输入4位取件码"
- 按钮："生成分享"

**Step 3 - 生成成功页：**
- 卡片1：安全链接 `https://mimama.link/s/ab9K...` + "复制链接"按钮
- 卡片2：取件码"4827"(大号数字) + "请通过另一种方式告知对方取件码" + "复制取件码"
- 底部按钮："发送到微信"(主) / "完成"(次)
- 安全说明："为降低泄露风险，建议不要将链接和取件码发在同一条消息中。"
- 微信自动填分享文案："我通过密麻麻给你发了一条安全信息，请打开链接后输入取件码领取。链接将在1小时后失效。"

### 接收方流程
- 打开链接→"领取安全信息"页面(显示来自/类型/剩余时间/剩余次数)
- 输入4位取件码→"立即领取"
- 查看页：内容卡片+复制按钮
- 底部强提示："你正在查看一次性安全信息。关闭页面后，内容可能无法再次打开。"
- view count=1时离开前弹确认："确认关闭后，此内容将不能再次查看。"

### 3种失效状态
| 状态 | 标题 | 说明 |
|------|------|------|
| 已过期 | 该分享已过期 | 链接已自动失效，请联系发送方重新分享 |
| 次数用完 | 该分享已被领取完毕 | 已达到查看次数上限 |
| 取件码错误 | 取件码错误，请重新输入 | 连续5次错误→暂时锁定10分钟 |

### 规则上限
- 最长有效期：24小时 / 最高查看次数：5次
- 禁止分享：OTP/恢复码/主密码/私钥
- 发送方可随时撤销："立即失效"按钮

## 14.2 回收站

### 即时反馈
删除密码→Toast"已移入回收站"+右侧"撤销"按钮(3秒)

### 回收站页面
- 标题："回收站"
- 顶部说明："已删除项目会在30天后自动彻底清除。恢复后将回到原分类。" + 右上角"清空"
- 列表项：图标+标题+用户名+删除时间+"3天前删除"+剩余时间"27天后清除"
- 右侧操作：恢复 / 更多菜单(立即删除/查看详情)
- 银行卡/身份证显示类型徽标
- 底部浮动栏（选中时出现）：恢复 / 彻底删除
- 清空确认："清空回收站？清空后，所有已删除项目将立即彻底移除，且无法恢复。"
- 空状态：空回收桶插画 + "回收站是空的" + "删除的项目会先在这里保留30天"

## 14.3 批量操作

### 进入方式
- 长按任意密码项
- 右上角菜单："批量管理"

### 多选模式
- 导航栏：取消 / 已选择3项 / 全选(已全选则"取消全选")
- 每个卡片左侧：圆形选择框(未选空心/选中品牌色勾选圆)

### 底部浮动操作栏（4个，选0项时隐藏）
| 操作 | 弹窗文案 |
|------|---------|
| 删除 | "删除这8项？删除后会先移入回收站，30天内可恢复。" |
| 移到分类 | 底部弹出分类选择器 |
| 导出 | 进入导出格式选择（如选明文则触发安全警告） |
| 收藏 | Toast"已收藏6项" |

## 14.4 统一交互原则
- **三层风险等级**：低(Toast+撤销) / 中(确认弹窗) / 高(全屏警告+长按)
- **所有不可逆操作都给后悔机会**
- **文案风格**：不吓人但明确、不堆技术词、不用模糊表达
  - ✅ 用："无法找回" / "立即失效" / "仅显示一次" / "30天后彻底清除"
  - ❌ 不用："可能存在一定风险" / "建议您妥善处理"


# 第十五章：高级安全功能（Decoy Vault / Panic Lock / Travel Mode / Multi-Vault）

## 15.1 Decoy Vault（诱饵保险箱）

### 设计原理
主PIN→真实库，诱饵PIN→诱饵库。生物识别默认仅绑定真实库，诱饵库必须手动PIN。

### 推荐默认内容（5-10条普通密码）
淘宝 / 京东 / B站 / 网易云音乐 / Steam / 小红书 / 会员卡 / 普通OTP

### 伪装规则
- 顶部小灰字"个人保险库"（与真实库一致，降低怀疑）
- 锁图标：真实库实心 / 诱饵库细线（细微视觉差异）
- Accent色：诱饵库轻微偏灰蓝

### 数据边界（绝对不进入诱饵库）
银行卡 / 身份证 / 恢复码 / API密钥 / 工作凭证 / OTP

### 开发优先级：P3

## 15.2 Panic Lock（紧急锁定）

### 3种触发方式
1. 应用内连续点按5次标题栏
2. 输入特殊PANIC PIN：000258
3. 摇一摇（可选，默认关闭）

### 可配置动作组合（默认）
立即锁定 + 清空剪贴板 + 抹除任务页预览 + 返回解锁页

### 高级动作
- 切换到诱饵库（需先启用Decoy Vault）
- 伪装模式1：假崩溃页"应用异常，已自动关闭敏感内容"
- 伪装模式2：输入Panic PIN后表面正常，实际进入诱饵库

### 恢复流程
仅记录"安全动作已执行"，不记录"Panic被触发"。用户在解锁页正常输入主密码即可恢复。

### 开发优先级：P2

## 15.3 Travel Mode（旅行模式）

### 三类隐藏规则
- 按保险箱：Hidden保险库全部
- 按标签：用户自定义标签
- 按内容类型：所有OTP + 恢复码 + 数字钱包 + 身份证件 + 银行卡 + 工作保险箱

### 双安全模式
- **轻量模式**：仅隐藏视图，数据仍在本地
- **强安全模式**：从数据库逻辑卸载（更安全但无法查看）

### 定时提醒
3天 / 7天 / 14天
- 文案："当前仍处于特殊保护模式"（不暴露具体内容）

### 退出
需要生物识别+主密码二次验证

### 开发优先级：P2

## 15.4 Multi-Vault（多保险箱）

### 5种保险箱类型
| 类型 | 图标 | 颜色 |
|------|------|------|
| 个人 | 👤 | 蓝 #176B87 |
| 家庭 | 🏠 | 绿 #2E8B57 |
| 工作 | 💼 | 灰 #475569 |
| 隐藏 | 🌙 | 紫灰 #6B5B95 |
| 诱饵 | 🔒 | 独立隔离 |

### 切换UI
首页左上角"个人保险库 ▾" → Bottom Sheet列表

### 安全规则
- 工作/隐藏保险箱支持二次生物识别
- 首版不做真正跨设备共享，仅支持复制/移动到其他保险箱

### 开发优先级：P1（与OTP+WebDAV一起）

## 15.5 Stitch提示词
> "Mobile UI, Panic Lock trigger page. After 5 rapid taps on title bar, a full-screen overlay appears with dark blurred background. Center: large red shield icon with exclamation mark. Title '安全锁定已激活' in 20px. Description: '密麻麻已锁定，剪贴板已清空。' Bottom: '输入主密码解锁' standard unlock field. Subtle animation: slow pulse on shield icon. Professional, calm but urgent aesthetic. 4k."


# 第十六章：2FA/OTP系统

## 16.1 双入口
1. 密码详情页内嵌OTP区域（倒计时+一键复制）
2. 独立"动态验证码"页面（所有TOTP账户列表）

## 16.2 QR扫描导入
- 识别otpauth://协议 → 解析issuer/account/secret/algorithm/digits/period
- 自动匹配现有条目（同一issuer+account的登录条目）

### 手动输入
- Base32校验（自动去除空格和连字符）
- 字段：密钥(Base32) / 位数(6/8) / 周期(30s) / 账号名称

## 16.3 倒计时三段式视觉（ChatGPT独有设计）
| 阶段 | 时间 | 圆环样式 | 数字样式 |
|------|------|---------|---------|
| 正常 | 30-11s | 细圆环(2px) | 正常显示 |
| 强调 | 10-4s | 圆环变粗(4px)+脉冲 | 数字脉冲 |
| 警告 | 3-0s | 圆环变红 | "即将刷新"标签 |

## 16.4 智能复制策略（ChatGPT独有）
| 剩余时间 | 行为 | 理由 |
|---------|------|------|
| >7s | 直接复制到剪贴板+Toast"已复制" | 有足够时间粘贴 |
| 3-7s | 弹出选择："复制当前码" / "等待下一组" | 当前的可能马上过期 |
| ≤2s | 自动等待下一组+Toast"码已刷新，已复制新码" | 几乎无法使用 |

## 16.5 备份码管理
- 默认隐藏，需**二次生物识别**才可查看
- 支持手动输入/粘贴分行
- 首版不做OCR识别

## 16.6 密码详情页OTP区域
- 6位OTP码：20px Semibold，等宽字体
- 倒计时环形进度条（跟随三段式设计）
- 一键复制按钮(大尺寸，方便快速操作)
- 小字显示"即将刷新"（3-0s时）

## 16.7 Stitch提示词
> "Mobile UI, OTP/2FA section embedded in password detail page. White card (16px radius) on #F6F8FA. Title '动态验证码' in 14px #94A3B8. Center: large 6-digit code '847293' in 20px Semibold monospace font with circular countdown ring around it. Ring: 2px stroke, blue #176B87 normal (30-11s), pulsing amber (10-4s), red warning (3-0s) with '即将刷新' label. Right: large '复制' button in #176B87. Below: '下次刷新: 23s' in 12px #94A3B8. High contrast, high-urgency feel, clean 4k."


# 第十七章：技术架构、自动填充、通知、权限、性能、品牌视觉

## 17.1 技术架构

### 技术架构总览：三端异构存储策略

**核心设计**：微信小程序使用腾讯云数据库（云存储），Android 和 iOS 客户端保持纯本地加密存储。两套架构各自独立，不互为依赖。

| 平台 | 技术 | 数据库 | 加密核心 | **数据存储位置** |
|------|------|--------|---------|---------|
| 微信小程序 | WXML/WXSS/Wasm | 腾讯云开发数据库 + 本地缓存 | Wasm 加密库 | **腾讯云（加密）** |
| Android | Kotlin/Compose | SQLCipher(Room) | .so | **本地设备** |
| iOS | Swift/SwiftUI | SQLCipher(SwiftData) | .framework | **本地设备** |
| 跨平台核心 | C++/Rust | - | 三端编译 | - |

### 微信小程序 — 腾讯云数据库存储详细设计

**为什么小程序用云存储？**
微信小程序运行在微信沙箱内，无法直接访问手机文件系统，本地 Storage 容量有限（通常 <10MB），且用户换机/重装小程序时数据会丢失。使用腾讯云数据库可解决这些问题，同时保持腾讯云生态内的高可用性。

**数据库选型：腾讯云开发 CloudBase（Serverless 云数据库）**

| 功能模块 | 技术方案 | 说明 |
|---------|---------|------|
| 主数据存储 | 云开发数据库（CloudBase DB） | Serverless NoSQL，按量付费，无需管理实例 |
| 用户身份识别 | 微信 OpenID | 自动获取，无需额外注册 |
| 数据隔离 | `_openid` 字段级隔离 | 用户间数据完全隔离 |
| 实时同步 | 云函数 + 数据库监听 | 写入操作通过云函数执行，自动同步至云端 |
| 离线读取 | wx.setStorageSync 本地缓存 | 离线可查看已缓存数据，联网后自动刷新 |
| 冲突处理 | 时间戳比对（Last Write Wins） | 简单可靠的冲突解决策略 |
| 跨端数据同步 | RESTful API + JWT Token | Android/iOS 客户端可通过 API 读取小程序端云端数据（可选功能） |

**数据加密策略（应用层加密）：**
- 密码等敏感字段在写入云端前，先在本地进行 AES-256-GCM 加密
- 加密密钥由用户 PIN 码通过 Argon2id 派生（小程序端无主密码概念，使用 PIN）
- 云端存储的均为密文，腾讯云侧无法解密
- 即便数据库被入侵，攻击者也无法获取明文密码

**腾讯云安全配置：**
- **环境**：CloudBase 默认环境，Serverless 按调用量付费
- **密钥管理**：腾讯云 KMS 管理加密密钥
- **网络隔离**：仅允许微信小程序域名和白名单 API 域名访问
- **数据备份**：腾讯云自动 7 天备份 + 可选手动快照
- **访问权限**：安全规则 `auth.openid == doc._openid`，确保用户只能访问自己的数据
- **成本估算**：
  - 轻度用户（<100 条）：月成本 < ¥0.1
  - 重度用户（500-1000 条）：月成本约 ¥0.5-¥2
  - 10 万用户预估月成本 ¥200-¥500

**小程序端 PIN 码规则（保持不变）：**
- 6 位最低，禁止简单序列（123456 / 654321 / 111111）
- 5 次失败 -> 30 秒冷却 / 8 次失败 -> 重新配对原生 App
- 敏感操作（显示密码 / 复制密码 / 查看 CVV）需二次 PIN 验证

### Android/iOS 客户端 — 纯本地存储（保持不变）

**设计原则**：客户端坚持零服务器架构，数据永不离开用户设备。

### 4层安全架构（客户端端，纵深防御）
1. **Layer 1 Master Secret**: Argon2id -> 派生主密钥(MK)
2. **Layer 2 Vault Key**: 随机256位，被MK包装
3. **Layer 3 Record Encryption**: AES-256-GCM(AEAD)，每条独立加密
4. **Layer 4 SQLCipher**: 文件级+应用级双重保护

### Argon2id平台自适应参数
| 平台 | Memory | Iterations | Parallelism |
|------|--------|-----------|------------|
| Native(Android/iOS) | 64-128MB | 3 | 2-4 |
| Mini Program | 16-32MB | 2-3 | 1-2 |

### 客户端与小程序端的数据互通（可选功能）
- 客户端可选择通过 RESTful API + JWT Token 连接腾讯云
- 实现跨端查看/同步（需用户主动开启，默认关闭）
- 同步时数据仍为 AES-256-GCM 加密传输
- 用户可在设置中开启/关闭此功能

### WebDAV同步文件结构（仅客户端端，可选）
```
/mimama/
├── manifest.json
├── items/{item_id}.bin
├── deleted/{tombstone_id}.json
└── devices/{device_id}.json
```

## 17.2 系统自动填充

### iOS Credential Provider
- App Group共享容器 + 轻量级扩展读取器
- 扩展仅返回域名匹配的候选凭据
- 搜索"搜索全部项目"需显式操作
- 解锁有效期60-120秒

### Android AutofillService
- 解析AssistStructure → 检测字段类型 → 域名/包名匹配 → 构建Dataset
- Android 11+: 内联键盘建议
- 每行显示：站点图标+标题+掩码用户名+风险徽章

### Android悬浮窗
- 仅用于：破坏自动填充的旧App/游戏/WebView
- 用户必须手动开启
- 在银行/支付/系统设置页面自动抑制

## 17.3 通知系统（精确中文文案）

| 类型 | 标题 | 正文 |
|------|------|------|
| 安全提醒 | 安全提醒 | 检测到新的设备已连接到您的保险库。若非本人操作，请立即检查设备列表并更换恢复密钥。 |
| 风险预警 | 风险预警 | 您在"{账户名称}"使用的密码可能已泄露，建议立即修改。 |
| 到期提醒 | 到期提醒 | "{项目名称}"将在{N}天后到期，请及时更新。 |
| 同步状态 | 同步状态 | 您的保险库尚未完成同步：{原因}。 |

**禁止**：含明文密码/OTP/银行卡号/身份证号/恢复密钥/用户名的通知

## 17.4 权限管理

### iOS
| 权限 | 请求时机 | 文案 |
|------|---------|------|
| Face ID | 首次启用生物识别 | 用于通过Face ID快速解锁保险库。MiMaMa不会上传或存储您的生物特征信息。 |
| 通知 | 用户开启安全提醒时 | 用于接收安全提醒、到期提醒和同步异常通知，不会用于营销消息。 |
| 相机 | 点击扫描QR时 | 用于扫描设备连接二维码或恢复二维码，不会拍摄或上传其他内容。 |
| 相册 | 导入/导出QR图片时 | 用于导入二维码图片或保存恢复凭证图片，MiMaMa不会扫描无关照片。 |

### Android额外
| SYSTEM_ALERT_WINDOW | 手动开启悬浮填充时 | 用于在部分不支持系统自动填充的应用上显示悬浮填充入口。此权限仅在您主动开启后申请。 |

### 拒绝后Fallback
- 通知被拒→仅应用内状态中心
- 悬浮窗被拒→"MiMaMa仍可在支持的应用和浏览器中使用系统自动填充。"

## 17.5 性能目标
| 指标 | 目标 |
|------|------|
| 冷启动→锁定屏 | < 1.2s |
| 生物识别→列表可见 | < 600ms |
| 搜索1000条目Top20 | < 50ms |
| 详情页打开 | < 100ms |
| 解密保险库密钥 | < 300ms |
| 小程序FCP | < 1.0s |
| 小程序包大小 | ≤ 1.5MB |

## 17.5.5 技术补遗

### 离线广告预加载（Preload）
- App冷启动后，若检测到网络良好（WiFi或4G+），静默预加载一条激励视频广告到本地缓存
- 目的：防止用户点击导出时因网络波动导致广告加载不出来，卡死在导出环节
- 仅预加载1条，不占过多带宽；失败不重试，不影响其他功能
- 使用SDK内置预加载API（穿山甲/优量汇 `loadAd` 接口），缓存有效期遵循SDK默认策略
- 本地标记 `adPreloaded: true/false`，导出时先检查此标记

### 小程序端数据兜底（腾讯云 CloudBase）
- 微信小程序极容易被系统清理，且无法直接访问手机文件系统
- 小程序端数据通过腾讯云 CloudBase 加密存储，即使小程序被清理或删除，换手机登录微信后数据仍可找回
- 逻辑总结：App纯本地（零服务器）/ 小程序存云端（加密），两种架构互不依赖

## 17.6 App图标3个概念

### A. 竹编盾牌 (Bamboo Weave Shield) ⭐推荐
- 圆角方形+简化盾牌+内部6-8条对角编织线形成密集纹理
- 深青蓝主色#176B87+浅玉/银色高亮
- 平衡信任+中国文化+安全+跨平台可识别性

### B. 印章锁徽 (Seal Lock Emblem)
- 中式印章+锁结合，负空间形成钥匙孔
- 风险：可能显得政府化/老旧

### C. 交织M字母标 (Interlinked M Monogram)
- 2-3条2.5D丝带形成M字，负空间暗示盾牌/锁
- 最适合长期品牌系统

## 17.7 闪屏页
- 居中白色Logo(#176B87背景)
- 底部"Securely encrypted by SQLCipher"徽章
- 圆形加载动画


# 第十八章：合规、异常处理、测试、路线图、页面清单

## 18.1 合规（PIPL/GDPR）

### 数据最小化声明
- 不收集任何个人数据
- 无远程分析、无使用统计上传
- 所有数据本地加密存储

### PIPL合规要点
- 首次启动用户协议复选框 + 明确SDK列表
- 用户权利：访问/更正/删除/撤回同意
- 删除App即删除所有数据（天然满足"被遗忘权"）

### 隐私政策7项必填内容
1. 产品名称和开发者
2. 数据类型和处理目的
3. 数据存储方式和期限
4. 数据共享情况（无）
5. 用户权利说明
6. 安全措施说明
7. 联系方式

### 商店审核准备
- **iOS**：Demo Vault给审核员，静态密码
- **Android**：Google Play数据安全披露
- **微信小程序**：选择"工具>安全"分类，无需登录
- **加密出口合规**：iOS需要准备

## 18.2 异常处理（精确中文UX文案）

### 忘记主密码
- 标题："无法找回主密码"
- 正文："MiMaMa不保存您的主密码，也无法在服务器端重置。若您没有恢复密钥、可信设备或已开启的设备恢复方式，将无法解锁现有保险库。"
- CTA1："尝试恢复" / CTA2："重置并新建保险库"
- 恢复方式：生物识别+设备绑定恢复密钥 / 导入的紧急恢复包 / 已登录可信设备

### 设备丢失
- 标记为"已丢失" → 吊销同步令牌 → 吊销QR桥接会话 → 轮换同步密钥包装

### 数据库损坏
- 标题："保险库数据似乎已损坏，无法安全打开。"
- 检测→自动验证快照完整性→"从最近备份恢复" / "导出诊断文件" / "重置保险库"
- 存储策略：WAL模式+原子提交+保留当前DB+最近快照+迁移备份

### 越狱/Root检测（三级响应）
- 低风险：仅警告横幅"检测到当前设备安全性较低"
- 中风险：禁用截屏+缩短自动锁定+禁用系统剪贴板读取
- 高风险：每次启动需主密码+禁用自动填充+禁用QR桥接

### 剪贴板安全（ChatGPT独有差异化超时）
- 密码：30s / OTP：20s / 银行卡身份证：60s
- Android标记为敏感剪贴板内容
- 文案："已复制密码，将在30秒后清除剪贴板"

### 大库性能（1000+条目）
- 解锁时一次解密保险库密钥→元数据驻留内存→密钥按需延迟解密
- 目标：列表渲染<300ms / 搜索Top20<50ms / 详情<100ms / 自动填充<150ms
- 列表虚拟化强制 / 不对全库实时重算密码强度

## 18.3 测试策略

### Beta测试
- iOS：TestFlight（内部核心团队+1000公开测试者）
- Android：Google Play Console Beta + 蒲公英（中国内测分发）

### A/B测试
- 引导漏斗："安全优先" vs "便捷优先"信息→哪种主密码设置完成率更高

### 崩溃报告
- Sentry/Firebase Crashlytics + 自定义LogFilter
- 确保vault字符串永远不进入堆栈跟踪

## 18.4 路线图（8阶段）
| Phase | 功能 | 时间线 |
|-------|------|--------|
| 1 | 本地优先启动（核心密码管理+安全审计+导出） | v1.0 |
| 2 | Passkeys/WebAuthn（无密码认证） | v1.5 |
| 3 | 浏览器扩展（Chrome/Safari/Edge） | v2.0 |
| 4 | 桌面应用（macOS Catalyst + Windows Flutter） | v2.5 |
| 5 | 共享保险箱（非对称加密RSA/ECC） | v3.0 |
| 6 | 硬件安全密钥（YubiKey NFC/USB-C） | v3.5 |
| 7 | 凭据平台（开放API给开发者） | v4.0 |
| 8 | 高级安全智能（本地LLM密码建议） | v5.0 |

## 18.5 完整页面清单（ChatGPT版80+页）

### 核心认证（11页）
启动/欢迎/创建主密码/确认PIN/生物识别/风险提示/解锁/忘记PIN/锁定

### 主导航（6页）
首页/搜索/常用/分类/我的/回收站

### 条目浏览（5页）
列表/搜索结果/筛选/标签/空状态

### 条目创建（6页）
选择器/登录/银行卡/身份证/安全备注/自定义

### 条目详情（10页）
各类型详情/编辑/密码历史/复制确认/二次验证

### 密码工具（4页）
生成器/规则设置/OTP展示/OTP录入

### 组织管理（5页）
分类/标签/收藏/批量操作/回收站

### 导入导出（11页）
格式选择/字段映射/冲突处理/导出格式/风险警告/加密包/进度/成功/导入报告

### 同步配对（10页）
同步中心/设备列表/QR生成/扫码/确认/冲突/子集设置/WebDAV配置

### 安全中心（10页）
修改主密码/PIN管理/生物识别/自动锁定/剪贴板/截屏/设备信任/紧急锁定/旅行模式

### 设置支持（11页）
外观/语言/通知/关于/隐私/协议/开源/帮助/反馈

### 小程序专属（10页）
欢迎/PIN解锁/快速搜索/复制成功/复制并返回/简版详情/连接状态/会话过期/安全提示


# 第十九章：ChatGPT vs Gemini 关键差异总结

## 19.1 品牌名称
| | ChatGPT | Gemini |
|--|---------|--------|
| 推荐 | **密来来**（密麻麻暗示杂乱） | **密麻麻**（双关记忆点强） |

## 19.2 品牌色
| | ChatGPT | Gemini |
|--|---------|--------|
| 色值 | **#176B87**（深青蓝teal） | **#0052D9**（腾讯蓝） |
| 理念 | 冷静、保护 | 权威、稳定 |

## 19.3 设计精细度
| 维度 | ChatGPT | Gemini |
|------|---------|--------|
| 色阶 | 6级(100-600)每色 | 无 |
| 输入框状态 | 默认/悬停/聚焦/错误/禁用5种 | 仅默认/错误 |
| 按钮状态 | 默认/悬停/按压/禁用+尺寸 | 仅默认/禁用 |
| 卡片圆角 | 16px | 12px |
| 按钮高度 | 52px | 48px |
| 导航高度 | 56px | 84px |
| 密码卡片高度 | 76px min | 未指定 |
| 统计栏高度 | 84px | 未指定 |
| 暗色策略 | 深海军蓝底调#131A22 | 纯色板 |
| 缓动函数 | 4种精确cubic-bezier | 无 |

## 19.4 ChatGPT独有功能（Gemini没有）
| 功能 | 说明 |
|------|------|
| 多保险箱(5种) | 个人/家庭/工作/隐藏/诱饵 |
| Decoy Vault | 诱饵PIN→假保险箱 |
| Panic Lock | 3种触发+可配置动作组合 |
| Travel Mode | 3类隐藏规则+双安全模式 |
| OTP倒计时三段式 | 正常/强调/警告视觉 |
| OTP智能复制策略 | 按剩余时间动态调整 |
| 密码生成器兼容模式 | 银行保守/电商通用/开发者强度 |
| 数据导入字段映射 | 左右双列精确映射 |
| 安全分享 | 一次性链接+4位取件码完整流程 |
| 回收站30天 | 完整生命周期 |
| 批量操作 | 长按多选+4操作浮动栏 |
| 导出全屏警告 | 长按3秒确认 |
| 3级风险等级 | Toast/弹窗/全屏警告 |
| Argon2id平台自适应 | Native 64-128MB / 小程序 16-32MB |
| PIN严格规则 | 禁简单序列/冷却/重新配对/12h重验证 |
| 敏感操作二次PIN | 显示密码/复制密码/查看CVV |
| 拼音搜索 | 输入"xhs"匹配"小红书" |
| 中国别名匹配 | 同一App多种叫法 |
| 差异化剪贴板超时 | 密码30s/OTP 20s/银行卡60s |
| 80+页面清单 | Gemini仅20页 |

## 19.5 Gemini独有功能（ChatGPT没有）
| 功能 | 说明 |
|------|------|
| 密麻麻双关记忆 | Gemini坚持推荐 |
| 腾讯蓝品牌色 | Gemini坚持推荐 |
| 骨架屏加载 | Shimmer效果描述 |

## 19.6 综合PRD建议
1. **品牌色**：#176B87（ChatGPT的teal-blue更有差异化，避免与腾讯撞色）
2. **卡片圆角**：16px（ChatGPT更现代）
3. **按钮高度**：52px（ChatGPT更符合点击区域）
4. **Decoy Vault/Panic Lock/Travel Mode**：作为Pro版差异化功能
5. **OTP三段式倒计时+智能复制**：显著提升用户体验
6. **密码生成器兼容模式**：解决ICBC等中国场景
7. **安全分享**：解决家庭密码共享需求
8. **80+页面清单**：作为开发参考
9. **三级风险交互原则**：统一全App的确认机制
10. **文案风格**：不吓人但明确，不用模糊表达

---

# 第二十一章：变现与广告策略（全局统筹）

> 本章作为广告 SDK 对接人员的直接规格书，汇聚文档各处广告逻辑，统一管理。

## 21.1 核心理念
- 密麻麻通过**激励视频广告**和**开屏广告**收入维持研发运营
- 逻辑自圆其说：**用广告收入替代云服务器成本，从而实现客户端零服务器、数据不出库**
- 用户在引导阶段已签署"可持续隐私"广告契约（见第7章 Step 2）

## 21.2 开屏广告

### 原生App端（Android/iOS）
| 场景 | 触发规则 | 持续时间 |
|------|---------|---------|
| 冷启动 | 每次冷启动触发 | 3秒，1秒后可跳过 |
| 热启动 | 5分钟内不重复 | 不触发 |

### 微信小程序端
| 场景 | 触发规则 | 说明 |
|------|---------|------|
| 进入小程序 | 每次进入触发 | 小程序加载页广告（利用加载等待时间） |
| 二次进入 | 5分钟内不重复 | 避免打断用户紧急查找密码 |

## 21.3 激励视频广告

### 触发点（仅导出场景）
| 导出格式 | 是否触发 |
|---------|----------|
| PDF档案 | ✅ 必须观看 |
| HTML密匣 | ✅ 必须观看 |
| Excel表格 | ✅ 必须观看 |
| TXT纯文本 | 首次免费，之后需观看 |

### 执行流程
```
用户选择格式 -> NetworkCheck -> 唤起激励视频
  -> 播放完成(Ad Callback) -> generateFile() -> 分享面板
  -> 中途关闭 -> 立即中止，不生成文件
```

### 24小时冷却规则
- 当天看过一次激励视频 -> 24小时内所有导出不再触发广告
- 存储：本地 `lastAdWatchTimestamp`

### 预加载策略（技术规格）
- 冷启动后网络良好时静默预加载1条激励视频
- 仅预加载1条，失败不重试
- 导出时先检查 `adPreloaded` 标记

## 21.4 广告视觉规范
- 占屏 ≤ 40% 高度
- "跳过"按钮始终可见（3秒倒计时）
- 严禁：金融/游戏/社交类广告（仅品牌展示类）
- 严禁："摇一摇跳转""虚假关闭按钮"等诱导交互

## 21.5 零广告承诺
以下页面**永远不展示任何广告**：
- 密码库主页 / 搜索 / 密码详情 / 安全审计
- 添加/编辑密码 / 密码生成器 / 分类管理
- 设置 / 引导流程 / 解锁页面
- 仅在**导出流程**和**开屏**两个场景展示广告

## 文档结束

**密麻麻 MiMaMa PRD 最终合并版 v1.0-Final**
**来源：ChatGPT(8轮) + Gemini(23轮) 深度调研合并**
**日期：2026-04-13 | 共21章**


