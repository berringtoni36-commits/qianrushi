---
title: "208. 实现 Trie（前缀树）(Medium)"
tags: [tech, reference]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《208. 实现 Trie（前缀树）(Medium)》。"
---

# 208. 实现 Trie（前缀树）(Medium)

> **专题归类：** [[07-图论|07-图论]] · [[12-技巧专题|12-技巧专题]]
> **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/implement-trie-prefix-tree/)
> **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2576/)
> **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/426311/)
> **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 实现 Trie（前缀树）（LeetCode 208 · Medium）|直达本题最终代码]]

---

## 题目描述

Trie（发音类似 "try"）或者说 **前缀树** 是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。这一数据结构有相当多的应用情景，例如自动补全和拼写检查。

请你实现 Trie 类：

- `Trie()` 初始化前缀树对象。
- `void insert(String word)` 向前缀树中插入字符串 `word`。
- `boolean search(String word)` 如果字符串 `word` 在前缀树中，返回 `true`（即检索之前已插入）；否则返回 `false`。
- `boolean startsWith(String prefix)` 如果之前已插入的字符串 `word` 的前缀之一为 `prefix`，返回 `true`；否则返回 `false`。

**示例：**
```
输入：
["Trie", "insert", "search", "search", "startsWith", "insert", "search"]
[[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]
输出：
[null, null, true, false, true, null, true]

解释：
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // 返回 true
trie.search("app");     // 返回 false
trie.startsWith("app"); // 返回 true
trie.insert("app");
trie.search("app");     // 返回 true
```

---

## 🧩 题目详细分析

- **数据范围：** 1 ≤ word.length, prefix.length ≤ 2000，最多调用 3×10^4 次 insert/search/startsWith。
- **输入输出特征：** 只包含小写英文字母（题目规定），因此子节点可以用长度为 26 的数组实现，也可以用哈希表。字符串不含空格或特殊字符。
- **边界条件：** 空字符串是否有效？题目没说，但 word/prefix 长度至少为 1。插入空串通常视为无效操作。
- **核心约束：** search 要求精确匹配（完整单词），startsWith 只要求前缀匹配（不要求单词结尾标记）。同一个单词可能被插入多次？题目暗示可重复插入，但通常只需处理第一次插入（也可覆盖）。
- **隐藏条件：** 
  - Trie 本质上是一个 N 叉树，每个节点有若干子节点和一个 is_end 标志。
  - 前缀搜索只要求路径存在，不需要 is_end = true。
  - 空间换时间：Trie 的空间消耗大（每个字符一个节点），但查询时间只与字符串长度相关。

---

## 👶 小白版直白理解

Trie 就像一本按字母顺序组织的词典，但比普通词典更智能。

想象你有一个 **电话通讯录**，里面存了很多名字。每次你想查一个名字：
- `search("Alice")`：逐个字母 A → l → i → c → e，沿途检查每个字母的分支是否存在。
- `startsWith("Ali")`：只查前缀 A → l → i，不关心后面还有没有字母。
- `insert("Alice")`：看 A 有没有分支，没有就新建；再看 l，没有就新建……直到最后一个字母 e，做上标记"这是一个完整的名字"。

为什么不用哈希表？因为哈希表不能高效地查前缀！用哈希表查前缀需要遍历所有 key，而 Trie 只需沿树向下走即可。

---

## 💡 解题思路

### 思路一：字典实现（适合字符集较大/灵活场景）（教学优先）

**核心思想：** 每个 Trie 节点包含一个字典 `children` 和一个布尔标志 `is_end`。`children` 的键是字符，值是下一个 Trie 节点。插入和查找都从根节点出发，沿着字符路径走。

> **教学解法（原有模板保留）：** 用于理解本题核心写法；最终提交请使用页面顶部的精确 YXC 入口。

```cpp
class Trie {
public:
    struct Node {
        bool is_end;
        Node *son[26];
        Node() {
            is_end = false;
            for (int i = 0; i < 26; i ++ )
                son[i] = NULL;
        }
    }*root;

    /** Initialize your data structure here. */
    Trie() {
        root = new Node();
    }

    /** Inserts a word into the trie. */
    void insert(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) p->son[u] = new Node();
            p = p->son[u];
        }
        p->is_end = true;
    }

    /** Returns if the word is in the trie. */
    bool search(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return p->is_end;
    }

    /** Returns if there is any word in the trie that starts with the given prefix. */
    bool startsWith(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return true;
    }
};

/**
 * Your Trie object will be instantiated and called as such:
 * Trie* obj = new Trie();
 * obj->insert(word);
 * bool param_2 = obj->search(word);
 * bool param_3 = obj->startsWith(prefix);
 */
```
### 思路二：数组实现（适合固定小字符集，性能更高）

用长度为 26 的数组替代字典，访问更快（数组索引 O(1) vs 字典哈希 O(1) 但常数略大）。

```cpp
class Trie {
    struct Node {
        array<Node*, 26> child{};
        bool end = false;
    };
    Node* root = new Node;
public:
    Trie() {}
    void insert(string word) {
        Node* node = root;
        for (char c : word) {
            auto& next = node->child[c - 'a'];
            if (!next) next = new Node;
            node = next;
        }
        node->end = true;
    }
    bool search(string word) {
        Node* node = find(word);
        return node && node->end;
    }
    bool startsWith(string prefix) { return find(prefix); }
private:
    Node* find(const string& s) {
        Node* node = root;
        for (char c : s) {
            node = node->child[c - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }
};
```
**性能对比：** 数组版更快（内存连续，无哈希冲突），字典版更灵活（支持 Unicode、数字等所有字符）。

### 思路三：递归插入 + 删除操作扩展

Trie 也支持删除操作，但本题不要求。如果要做删除，可以采用递归或计数方式：

```cpp
class Trie {
    struct Node {
        array<Node*, 26> child{};
        bool end = false;
    };
    Node* root = new Node;
public:
    Trie() {}
    void insert(string word) {
        Node* node = root;
        for (char c : word) {
            auto& next = node->child[c - 'a'];
            if (!next) next = new Node;
            node = next;
        }
        node->end = true;
    }
    bool search(string word) {
        Node* node = find(word);
        return node && node->end;
    }
    bool startsWith(string prefix) { return find(prefix); }
private:
    Node* find(const string& s) {
        Node* node = root;
        for (char c : s) {
            node = node->child[c - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }
};
```
---

## ⚠️ 易错点

- **search vs startsWith 的区别：** `search` 要求精确匹配且 `is_end = true`；`startsWith` 只需要路径存在，**不需要 `is_end`**。这是最常见的 bug。
- **插入重复单词：** 重复插入同一单词时，第二次 insert 不会改变任何结构（路径已存在），但注意 `is_end` 已经为 true，无需再设。
- **空字符串处理：** 虽然题目没给空串，但如果你在根节点设置 `is_end = true`，相当于插入了空字符串，这会影响 search("") 的结果。
- **数组索引越界：** 使用数组实现时，必须确保字符在 'a'~'z' 范围内，`ord(ch) - ord('a')` 计算索引。如果字符集不保证是小写字母，用字典更安全。
- **子节点复用：** 插入 "app" 和 "apple" 时，"app" 路径会被两个单词共享。search("app") 依赖 `is_end` 判断，"apple" 的插入不会覆盖 "app" 的结尾标记。

---

## 🔧 框架提炼

**Trie 标准模板（字典版，最通用）：**

```cpp
class Trie {
public:
    struct Node {
        bool is_end;
        Node *son[26];
        Node() {
            is_end = false;
            for (int i = 0; i < 26; i ++ )
                son[i] = NULL;
        }
    }*root;

    /** Initialize your data structure here. */
    Trie() {
        root = new Node();
    }

    /** Inserts a word into the trie. */
    void insert(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) p->son[u] = new Node();
            p = p->son[u];
        }
        p->is_end = true;
    }

    /** Returns if the word is in the trie. */
    bool search(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return p->is_end;
    }

    /** Returns if there is any word in the trie that starts with the given prefix. */
    bool startsWith(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return true;
    }
};

/**
 * Your Trie object will be instantiated and called as such:
 * Trie* obj = new Trie();
 * obj->insert(word);
 * bool param_2 = obj->search(word);
 * bool param_3 = obj->startsWith(prefix);
 */
```
**适用场景：** 前缀匹配、自动补全、拼写检查、词频统计、IP 路由前缀匹配。

---

## 🔗 关联题目

- 211-添加与搜索单词 — Trie + DFS 模糊搜索（支持通配符 `.` 匹配任意字符），考察 Trie 与回溯的结合。
- 212-单词搜索 II — Trie + 网格回溯（在二维网格中找所有出现在字典中的单词），将 Trie 用作字典来加速前缀剪枝。
- 14-最长公共前缀 — 也可以用 Trie 解决（Trie 中从根向下唯一路径即最长公共前缀），但更简单的解法是纵向扫描。
