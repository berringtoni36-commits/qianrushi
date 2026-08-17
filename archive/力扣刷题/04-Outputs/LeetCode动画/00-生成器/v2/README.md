# LeetCode Animation V2

六题试点使用独立的完整状态 trace。渲染器只读取 trace，不执行或推断算法。

```bash
python3 build_v2.py
python3 validate_v2.py
```

输出目录：`../../../LeetCode动画-V2/试点/`

每份 trace 都保存 YXC 源码原始 SHA-256 与忽略注释、空格后的语义 token 哈希。验证器会重新从总题解提取代码并比较两个哈希。
