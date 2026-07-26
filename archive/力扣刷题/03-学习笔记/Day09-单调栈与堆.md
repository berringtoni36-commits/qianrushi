---
title: "Day 9 · 单调栈与堆"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 9 · 单调栈与堆》。"
---

# Day 9 · 单调栈与堆

> **日期：** 2026-__-__
> **学习目标：** 单调栈与堆（优先队列）的应用
> **相关知识页：** [[06-栈与堆|06-栈与堆]] · [[02-双指针与滑动窗口|02-双指针与滑动窗口]]

---

## 一、今日模板回顾

### 单调栈模板
```cpp
vector<int> dailyTemperaturesTemplate(const vector<int>& temperatures) {
    vector<int> answer(temperatures.size());
    stack<int> indices;
    for (int i = 0; i < static_cast<int>(temperatures.size()); ++i) {
        while (!indices.empty() && temperatures[indices.top()] < temperatures[i]) {
            answer[indices.top()] = i - indices.top();
            indices.pop();
        }
        indices.push(i);
    }
    return answer;
}
```
### 堆操作
```cpp
void heapTemplate(const vector<int>& values) {
    priority_queue<pair<int, int>> heap;
    for (int i = 0; i < static_cast<int>(values.size()); ++i)
        heap.push({values[i], i});
}
```
### 双堆求中位数
```cpp
class MedianTemplate {
    priority_queue<int> lower;
    priority_queue<int, vector<int>, greater<int>> upper;
public:
    void add(int value) {
        if (lower.empty() || value <= lower.top()) lower.push(value);
        else upper.push(value);
        if (lower.size() > upper.size() + 1) upper.push(lower.top()), lower.pop();
        if (upper.size() > lower.size()) lower.push(upper.top()), upper.pop();
    }
    double median() const {
        if (lower.size() == upper.size()) return (lower.top() + (double) upper.top()) / 2;
        return lower.top();
    }
};
```
---

## 二、做题记录

### 1. 每日温度（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/daily-temperatures/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/3329/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/1006809/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 每日温度（LeetCode 739 · Medium）|直达本题最终代码]]
- **题目详解：** [[739-每日温度|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 柱状图中最大的矩形（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/largest-rectangle-in-histogram/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2433/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/375419/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 柱状图中最大的矩形（LeetCode 84 · Hard）|直达本题最终代码]]
- **题目详解：** [[84-柱状图中最大的矩形|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 数组中的第 K 个最大元素（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/kth-largest-element-in-an-array/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2596/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/432564/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 数组中的第 K 个最大元素（LeetCode 215 · Medium）|直达本题最终代码]]
- **题目详解：** [[215-数组中的第K个最大元素|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 前 K 个高频元素（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/top-k-frequent-elements/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2736/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/487547/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 前 K 个高频元素（LeetCode 347 · Medium）|直达本题最终代码]]
- **题目详解：** [[347-前K个高频元素|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 数据流的中位数（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/find-median-from-data-stream/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2669/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/456538/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 数据流的中位数（LeetCode 295 · Hard）|直达本题最终代码]]
- **题目详解：** [[295-数据流的中位数|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

---

## 三、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢
