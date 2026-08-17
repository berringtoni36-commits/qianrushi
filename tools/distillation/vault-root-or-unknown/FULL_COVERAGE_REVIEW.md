# vault-root-or-unknown 六项逐一边界审计

> 当前清单明确给出 6 个 `vault-root-or-unknown` 文件；大小与 SHA-256 前 16 位来自 [`source-inventory-current.tsv`](source-inventory-current.tsv)，本报告不移动、删除、安装或复制这些文件。

## 逐项结论

| 路径 | 类型 | 大小（bytes） | SHA-256 前 16 位 | disposition | 文本索引 | 结论/排除理由 |
|---|---|---:|---|---|---|---|
| `.DS_Store` | `OS-metadata` | 6148 | `2239cb70e1b573bc` | `excluded` | no | macOS Finder metadata；无正文、无知识来源，不进入蒸馏或证据统计。 |
| `archive/dan_koe_如何在一天内修复你的人生_中文完整翻译.md` | `archived-translation` | 35234 | `5eb4fd0cd940eae0` | `archive` | no | 个人成长主题的外部译文，当前不属于嵌入式知识域；译文 provenance 和事实准确性未作为技术源核验。 |
| `projects/.DS_Store` | `OS-metadata` | 8196 | `d19a8d26522e2b12` | `excluded` | no | macOS Finder metadata；无正文、无知识来源，不进入蒸馏或证据统计。 |
| `resume-deepdive.skill` | `skill-package-zip` | 57878 | `fa8550a69aaaa47a` | `archive` | no | 根目录未命名/未登记的 Skill ZIP；只读核对内部成员，未安装、未解包写回，也不把包内内容计入当前 Skill。 |
| `zin3sgj2` | `skill-package-zip` | 57878 | `9a16c441b4b7e994` | `archive` | no | 根目录未命名/未登记的 Skill ZIP；只读核对内部成员，未安装、未解包写回，也不把包内内容计入当前 Skill。 |
| `测试.md` | `unknown-markdown` | 348 | `2a09ae39bb704d2c` | `needs-review` | no | 文本存在但 provenance、所属域和蒸馏用途未登记；不应由文件名推断为技术事实。 |

## ZIP 包只读核对

- `resume-deepdive.skill`：6 个文件成员，解压后总大小 68,254 bytes；成员名/大小/CRC 与另一包一致。
- `zin3sgj2`：6 个文件成员，解压后总大小 68,254 bytes；成员名/大小/CRC 与另一包一致。
- 两个包的外层文件 SHA-256 不同；内部成员名、大小和 CRC 一致。因此保留为两个独立待审计路径，不能只凭相同大小合并，也没有把内部 `SKILL.md` 当作已安装或规范 Skill。
- `resume-deepdive.skill` 的成员为 `SKILL.md`、4 个 references Markdown 和 `assets/avatar.png`；`zin3sgj2` 的成员清单相同。此处只记录包边界，不复制或解包二进制。

## 口径与待审计项

- `.DS_Store` 与 `projects/.DS_Store` 明确排除：它们是 macOS Finder 元数据，不是知识或技术证据。
- `archive/dan_koe_如何在一天内修复你的人生_中文完整翻译.md` 归入 `archive`：它是外部个人成长译文，不属于当前嵌入式技术域，且没有进入当前文本索引/规范 Skill 来源链。若要保留其内容价值，应另行确认版权、原文 provenance 与域归属。
- 两个 ZIP 归入 `archive` 而非 `source`：包格式和内容成员已识别，但根目录 provenance、安装意图和与客户端/规范 Skill 的关系尚未登记；后续如需采用，必须由用户确认来源并在隔离位置复核。
- `测试.md` 归入 `needs-review`：它是可读文本，但命名、所属域和来源链不足；不能因“是 Markdown”就视为已蒸馏。

## 机器可读表

[`disposition.tsv`](tools/distillation/vault-root-or-unknown/disposition.tsv) 保留 6 项的类型、大小、哈希、文本索引和不能等同于已蒸馏的理由。

